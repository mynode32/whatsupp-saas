"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/actions/auth";
import type { Database } from "@/lib/supabase/types";

/** Paragraph-based chunking, capped at ~800 chars per chunk — good enough for FTS at this scale. */
function chunkContent(content: string): string[] {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if (current && (current + "\n\n" + p).length > 800) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : content.trim() ? [content.trim()] : [];
}

async function resyncChunks(supabase: SupabaseClient<Database>, documentId: string, organizationId: string, content: string) {
  await supabase.from("knowledge_chunks").delete().eq("document_id", documentId);
  const pieces = chunkContent(content);
  if (pieces.length === 0) return;
  await supabase.from("knowledge_chunks").insert(
    pieces.map((content, chunk_index) => ({ organization_id: organizationId, document_id: documentId, chunk_index, content })),
  );
}

const articleSchema = z.object({
  organizationId: z.uuid(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().optional(),
});

export async function createArticleAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = articleSchema.safeParse({
    organizationId: formData.get("organizationId"),
    title: formData.get("title"),
    content: formData.get("content"),
    category: formData.get("category") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: doc, error } = await supabase
    .from("knowledge_documents")
    .insert({
      organization_id: parsed.data.organizationId,
      title: parsed.data.title,
      content: parsed.data.content,
      category: parsed.data.category ?? null,
      status: "draft",
      updated_by: user.id,
    })
    .select("id")
    .single();
  if (error || !doc) return { error: error?.message ?? "Could not create article" };

  revalidatePath("/knowledge");
  redirect(`/knowledge/${doc.id}`);
}

const updateSchema = articleSchema.extend({ id: z.uuid() });

export async function updateArticleAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    organizationId: formData.get("organizationId"),
    title: formData.get("title"),
    content: formData.get("content"),
    category: formData.get("category") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: existing, error: fetchError } = await supabase
    .from("knowledge_documents")
    .select("status")
    .eq("id", parsed.data.id)
    .single();
  if (fetchError || !existing) return { error: "Article not found" };

  const { error } = await supabase
    .from("knowledge_documents")
    .update({ title: parsed.data.title, content: parsed.data.content, category: parsed.data.category ?? null, updated_by: user.id })
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };

  if (existing.status === "published") {
    await resyncChunks(supabase, parsed.data.id, parsed.data.organizationId, parsed.data.content);
  }

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${parsed.data.id}`);
  return { success: true };
}

const statusSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  status: z.enum(["draft", "published", "archived"]),
});

export async function setArticleStatusAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("knowledge_documents")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("content")
    .single();
  if (error || !doc) return { error: error?.message ?? "Could not update status" };

  if (parsed.data.status === "published") {
    await resyncChunks(supabase, parsed.data.id, parsed.data.organizationId, doc.content);
  } else {
    // Draft/archived articles must not be retrievable — clear their chunks.
    await supabase.from("knowledge_chunks").delete().eq("document_id", parsed.data.id);
  }

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${parsed.data.id}`);
  return { success: true };
}

const deleteSchema = z.object({ id: z.uuid() });

export async function deleteArticleAction(formData: FormData): Promise<void> {
  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("knowledge_documents").delete().eq("id", parsed.data.id);
  revalidatePath("/knowledge");
  redirect("/knowledge");
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/actions/auth";

const createSchema = z.object({
  organizationId: z.uuid(),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  shortcut: z.string().optional(),
});

export async function createSavedReplyAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = createSchema.safeParse({
    organizationId: formData.get("organizationId"),
    title: formData.get("title"),
    body: formData.get("body"),
    shortcut: formData.get("shortcut") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("saved_replies").insert({
    organization_id: parsed.data.organizationId,
    title: parsed.data.title,
    body: parsed.data.body,
    shortcut: parsed.data.shortcut ?? null,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

const deleteSchema = z.object({ id: z.uuid() });

export async function deleteSavedReplyAction(formData: FormData): Promise<void> {
  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("saved_replies").delete().eq("id", parsed.data.id);
  revalidatePath("/settings");
}

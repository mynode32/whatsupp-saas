import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapNullable } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";

type KnowledgeDocument = Database["public"]["Tables"]["knowledge_documents"]["Row"];

export async function listArticles(
  organizationId: string,
  opts: { category?: string; query?: string } = {},
): Promise<KnowledgeDocument[]> {
  const supabase = await createClient();
  let q = supabase
    .from("knowledge_documents")
    .select("*")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.query) q = q.ilike("content", `%${opts.query}%`);
  return unwrap(await q);
}

export async function getArticle(id: string): Promise<KnowledgeDocument | null> {
  const supabase = await createClient();
  return unwrapNullable(await supabase.from("knowledge_documents").select("*").eq("id", id).maybeSingle());
}

export async function countChunks(documentId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("knowledge_chunks")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);
  return count ?? 0;
}

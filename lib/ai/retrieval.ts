import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type GroundingChunk = { content: string; documentId: string; documentTitle: string };

/**
 * Full-text search over this org's published knowledge chunks (the same
 * search_vector index Faz 4's knowledge search uses). Two queries instead
 * of a join: the hand-written Database type has empty Relationships on
 * every table, so embedded-resource selects type as `never` — see the
 * repo's history of postgrest-js typing gotchas.
 */
export async function findGroundingChunks(
  admin: SupabaseClient<Database>,
  organizationId: string,
  queryText: string,
  limit = 4,
): Promise<GroundingChunk[]> {
  const { data: chunks } = await admin
    .from("knowledge_chunks")
    .select("content, document_id")
    .eq("organization_id", organizationId)
    .textSearch("search_vector", queryText, { type: "websearch", config: "simple" })
    .limit(limit * 3);
  if (!chunks || chunks.length === 0) return [];

  const documentIds = [...new Set(chunks.map((c) => c.document_id))];
  const { data: docs } = await admin
    .from("knowledge_documents")
    .select("id, title")
    .in("id", documentIds)
    .eq("status", "published");
  const publishedTitles = new Map((docs ?? []).map((d) => [d.id, d.title]));

  const grounded: GroundingChunk[] = [];
  for (const chunk of chunks) {
    const title = publishedTitles.get(chunk.document_id);
    if (!title) continue;
    grounded.push({ content: chunk.content, documentId: chunk.document_id, documentTitle: title });
    if (grounded.length >= limit) break;
  }
  return grounded;
}

import { createClient } from "@/lib/supabase/server";
import { listArticles } from "@/lib/db/knowledge";
import { KnowledgeClient } from "@/components/app/knowledge-client";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  const articles = membership
    ? await listArticles(membership.organization_id, { category, query: q })
    : [];

  const allArticles = membership && (category || q) ? await listArticles(membership.organization_id) : articles;
  const categories = [...new Set(allArticles.map((a) => a.category).filter((c): c is string => !!c))];

  return <KnowledgeClient articles={articles} categories={categories} category={category} query={q} />;
}

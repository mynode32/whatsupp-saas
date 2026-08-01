import { notFound } from "next/navigation";
import { getArticle, countChunks } from "@/lib/db/knowledge";
import { ArticleForm } from "@/components/app/article-form";
import { ArticleStatusControls } from "@/components/app/article-status-controls";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const chunkCount = article.status === "published" ? await countChunks(id) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ArticleStatusControls
        id={article.id}
        organizationId={article.organization_id}
        status={article.status}
        chunkCount={chunkCount}
      />
      <ArticleForm organizationId={article.organization_id} article={article} />
    </div>
  );
}

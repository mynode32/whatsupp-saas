import { createClient } from "@/lib/supabase/server";
import { ArticleForm } from "@/components/app/article-form";

export default async function NewArticlePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <ArticleForm organizationId={membership!.organization_id} />
    </div>
  );
}

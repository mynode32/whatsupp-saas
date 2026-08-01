import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { finalizeInstagramConnectionAction } from "@/lib/actions/channels";
import type { MetaPageCandidate } from "@/lib/meta/connect";

/**
 * Shown when the Instagram OAuth callback found more than one Facebook
 * Page with a linked Instagram Business account. The candidates (with
 * their page access tokens) live only in an httpOnly cookie set by that
 * callback — this page reads it server-side and never puts a token in
 * the client-rendered HTML.
 */
export default async function InstagramPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const { organizationId } = await searchParams;
  const cookieStore = await cookies();
  const raw = cookieStore.get("ig_oauth_candidates")?.value;
  if (!organizationId || !raw) redirect("/settings?instagram_error=expired");

  let candidates: MetaPageCandidate[];
  try {
    candidates = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    redirect("/settings?instagram_error=expired");
  }
  if (candidates.length === 0) redirect("/settings?instagram_error=no_pages");

  return (
    <div className="mx-auto max-w-lg space-y-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Instagram hesabını seç</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bu Facebook hesabında birden fazla Sayfa var. Bağlamak istediğin Instagram hesabını seç.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {candidates.map((candidate) => (
            <form key={candidate.pageId} action={finalizeInstagramConnectionAction}>
              <input type="hidden" name="organizationId" value={organizationId} />
              <input type="hidden" name="pageId" value={candidate.pageId} />
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {candidate.instagramUsername ? `@${candidate.instagramUsername}` : candidate.instagramAccountId}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{candidate.pageName}</p>
                </div>
                <Button type="submit" variant="outline">
                  Bağla
                </Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

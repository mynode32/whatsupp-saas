import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getInvitationByToken } from "@/lib/db/invitations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const invitation = token ? await getInvitationByToken(token) : null;

  let orgName = "";
  if (invitation) {
    const admin = createAdminClient();
    const { data: org } = await admin
      .from("organizations")
      .select("name")
      .eq("id", invitation.organization_id)
      .maybeSingle();
    orgName = org?.name ?? "";
  }

  const invalid =
    !invitation ||
    invitation.status !== "pending" ||
    // eslint-disable-next-line react-hooks/purity -- this route is forced dynamic (cookies() via createClient()), never statically cached, so a per-request Date.now() is safe
    new Date(invitation.expires_at).getTime() < Date.now();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Logo className="justify-center" />

        {invalid ? (
          <p className="text-sm text-muted-foreground">
            This invitation link is invalid or has expired.
          </p>
        ) : !user ? (
          <>
            <p className="text-sm text-muted-foreground">
              Sign in with the email this invitation was sent to, then come back to this link.
            </p>
            <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
              Go to login
            </Link>
          </>
        ) : user.email?.toLowerCase() !== invitation.email.toLowerCase() ? (
          <p className="text-sm text-muted-foreground">
            You&apos;re signed in as {user.email}, but this invitation was sent to {invitation.email}.
          </p>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold tracking-tight">You&apos;ve been invited</h1>
            <AcceptInviteForm token={token!} orgName={orgName} role={invitation.role} />
          </>
        )}
      </div>
    </div>
  );
}

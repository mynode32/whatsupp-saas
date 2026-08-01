import { createClient } from "@/lib/supabase/server";
import { getOrganization } from "@/lib/db/organizations";
import { listTeamMembers } from "@/lib/db/team";
import { listPendingInvitations } from "@/lib/db/invitations";
import { listSavedReplies } from "@/lib/db/saved-replies";
import { SettingsClient } from "@/components/app/settings-client";
import { publicEnv } from "@/lib/env";
import { integrationStatus } from "@/lib/env.server";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ instagram_error?: string; instagram?: string }>;
}) {
  const { instagram_error: instagramError, instagram: instagramStatus } = await searchParams;
  const connected: Record<string, boolean> = { ...integrationStatus };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  const [organization, members, invitations, channels, savedReplies] = membership
    ? await Promise.all([
        getOrganization(membership.organization_id),
        listTeamMembers(membership.organization_id),
        listPendingInvitations(membership.organization_id),
        supabase
          .from("channel_connections")
          .select("*")
          .eq("organization_id", membership.organization_id)
          .then((r) => r.data ?? []),
        listSavedReplies(membership.organization_id),
      ])
    : [null, [], [], [], []];

  return (
    <SettingsClient
      connected={connected}
      organization={organization}
      members={members}
      invitations={invitations}
      channels={channels}
      savedReplies={savedReplies}
      currentUserId={user!.id}
      currentUserRole={membership?.role ?? "viewer"}
      appUrl={publicEnv.NEXT_PUBLIC_APP_URL}
      instagramError={instagramError ?? null}
      instagramConnected={instagramStatus === "connected"}
    />
  );
}

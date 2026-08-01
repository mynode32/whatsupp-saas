import appConfig from "@/app.config";
import { createClient } from "@/lib/supabase/server";
import { getOrganization } from "@/lib/db/organizations";
import { listTeamMembers } from "@/lib/db/team";
import { listPendingInvitations } from "@/lib/db/invitations";
import { SettingsClient } from "@/components/app/settings-client";

export default async function SettingsPage() {
  const connected: Record<string, boolean> = {};
  for (const it of appConfig.integrations) {
    connected[it.key] = it.envVars.every((v) => !!process.env[v]);
  }

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

  const [organization, members, invitations, channels] = membership
    ? await Promise.all([
        getOrganization(membership.organization_id),
        listTeamMembers(membership.organization_id),
        listPendingInvitations(membership.organization_id),
        supabase
          .from("channel_connections")
          .select("*")
          .eq("organization_id", membership.organization_id)
          .then((r) => r.data ?? []),
      ])
    : [null, [], [], []];

  return (
    <SettingsClient
      connected={connected}
      organization={organization}
      members={members}
      invitations={invitations}
      channels={channels}
      currentUserId={user!.id}
      currentUserRole={membership?.role ?? "viewer"}
    />
  );
}

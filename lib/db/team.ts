import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unwrap } from "@/lib/db/errors";
import type { OrgRole } from "@/lib/supabase/types";

export type TeamMember = {
  id: string;
  userId: string;
  role: OrgRole;
  fullName: string | null;
  email: string | null;
  createdAt: string;
};

/**
 * organization_members has no name/email — those live in profiles and
 * auth.users. Emails aren't exposed through any RLS-safe client table,
 * so this composite fetch uses the admin client for the auth.users
 * lookup only, after fetching membership rows through the normal
 * (RLS-respecting) session client.
 */
export async function listTeamMembers(organizationId: string): Promise<TeamMember[]> {
  const supabase = await createClient();
  const members = unwrap(
    await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
  );
  if (members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const profiles = unwrap(await supabase.from("profiles").select("*").in("id", userIds));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const admin = createAdminClient();
  const emailById = new Map<string, string | null>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      emailById.set(id, data.user?.email ?? null);
    }),
  );

  return members.map((m) => ({
    id: m.id,
    userId: m.user_id,
    role: m.role,
    fullName: profileById.get(m.user_id)?.full_name ?? null,
    email: emailById.get(m.user_id) ?? null,
    createdAt: m.created_at,
  }));
}

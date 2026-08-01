import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unwrap, unwrapNullable } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";

type Invitation = Database["public"]["Tables"]["invitations"]["Row"];

export async function listPendingInvitations(organizationId: string): Promise<Invitation[]> {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("invitations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  );
}

/**
 * Service-role lookup: the invitee isn't an org member yet, so the
 * admin-only invitations SELECT policy would otherwise block them from
 * reading their own invitation. Knowing the (unguessable) token is the
 * proof of access here, not org membership.
 */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const supabase = createAdminClient();
  return unwrapNullable(
    await supabase.from("invitations").select("*").eq("token", token).maybeSingle(),
  );
}

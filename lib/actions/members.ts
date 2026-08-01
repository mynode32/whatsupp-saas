"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInvitationByToken } from "@/lib/db/invitations";
import { publicEnv } from "@/lib/env";
import { logAuditEvent } from "@/lib/audit/log";
import type { AuthActionState } from "@/lib/actions/auth";
import type { OrgRole } from "@/lib/supabase/types";

/** Maps a Postgres RLS denial into a friendly message instead of a raw DB error. */
function friendlyDbError(message: string) {
  if (message.toLowerCase().includes("row-level security") || message.includes("42501")) {
    return "You don't have permission to do that.";
  }
  return message;
}

const inviteSchema = z.object({
  organizationId: z.uuid(),
  email: z.email(),
  role: z.enum(["admin", "agent", "viewer"]),
});

export async function inviteMemberAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = inviteSchema.safeParse({
    organizationId: formData.get("organizationId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: invitation, error: insertError } = await supabase
    .from("invitations")
    .insert({
      organization_id: parsed.data.organizationId,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (insertError) return { error: friendlyDbError(insertError.message) };

  const admin = createAdminClient();
  const next = `/invite/accept?token=${invitation.token}`;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
  });
  // A pending Supabase invite for the same email returns an error even
  // though our own invitation row was created fine — surface it, but
  // don't treat it as a hard failure since the row + token still work.
  if (inviteError && !inviteError.message.toLowerCase().includes("already registered")) {
    return { success: true, message: `Invitation created, but the email could not be sent: ${inviteError.message}` };
  }

  await logAuditEvent({
    organizationId: parsed.data.organizationId,
    actorId: user.id,
    action: "invite_member",
    targetType: "invitation",
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/settings");
  return { success: true, message: "invited" };
}

const cancelInvitationSchema = z.object({ invitationId: z.uuid() });

export async function cancelInvitationAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = cancelInvitationSchema.safeParse({ invitationId: formData.get("invitationId") });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", parsed.data.invitationId);
  if (error) return { error: friendlyDbError(error.message) };

  revalidatePath("/settings");
  return { success: true };
}

const updateRoleSchema = z.object({
  memberId: z.uuid(),
  role: z.enum(["owner", "admin", "agent", "viewer"]),
});

export async function updateMemberRoleAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updateRoleSchema.safeParse({
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: target } = await supabase
    .from("organization_members")
    .select("organization_id, user_id, role")
    .eq("id", parsed.data.memberId)
    .maybeSingle();
  if (!target) return { error: "Member not found" };

  const { data: actor } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", target.organization_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!actor || (actor.role !== "owner" && actor.role !== "admin")) {
    return { error: "You don't have permission to do that." };
  }
  if (actor.role !== "owner" && (target.role === "owner" || parsed.data.role === "owner")) {
    return { error: "Only an owner can grant or change the owner role." };
  }

  const { data: updated, error } = await supabase
    .from("organization_members")
    .update({ role: parsed.data.role as OrgRole })
    .eq("id", parsed.data.memberId)
    .select("organization_id, user_id")
    .single();
  if (error) return { error: friendlyDbError(error.message) };

  await logAuditEvent({
    organizationId: updated.organization_id,
    actorId: user.id,
    action: "update_member_role",
    targetType: "organization_member",
    targetId: updated.user_id,
    metadata: { role: parsed.data.role },
  });

  revalidatePath("/settings");
  return { success: true };
}

const removeMemberSchema = z.object({ memberId: z.uuid() });

export async function removeMemberAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = removeMemberSchema.safeParse({ memberId: formData.get("memberId") });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: target } = await supabase
    .from("organization_members")
    .select("organization_id, user_id")
    .eq("id", parsed.data.memberId)
    .maybeSingle();

  const { error } = await supabase.from("organization_members").delete().eq("id", parsed.data.memberId);
  if (error) return { error: friendlyDbError(error.message) };

  if (target) {
    await logAuditEvent({
      organizationId: target.organization_id,
      actorId: user?.id ?? null,
      action: "remove_member",
      targetType: "organization_member",
      targetId: target.user_id,
    });
  }

  revalidatePath("/settings");
  return { success: true };
}

const acceptInvitationSchema = z.object({ token: z.uuid() });

export async function acceptInvitationAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = acceptInvitationSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) return { error: "Invalid invitation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const invitation = await getInvitationByToken(parsed.data.token);
  if (!invitation) return { error: "Invitation not found" };
  if (invitation.status !== "pending") return { error: "This invitation is no longer valid" };
  if (new Date(invitation.expires_at).getTime() < Date.now()) return { error: "This invitation has expired" };
  if (invitation.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return { error: "This invitation was sent to a different email address" };
  }

  // Service-role: the invitee isn't a member yet, so the normal
  // admin-only organization_members insert policy would block this —
  // the token itself (already verified above) is the authorization.
  const admin = createAdminClient();
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({ organization_id: invitation.organization_id, user_id: user.id, role: invitation.role });
  if (memberError) return { error: memberError.message };

  await admin.from("invitations").update({ status: "accepted" }).eq("id", invitation.id);

  await logAuditEvent({
    organizationId: invitation.organization_id,
    actorId: user.id,
    action: "accept_invitation",
    targetType: "organization_member",
    targetId: user.id,
    metadata: { role: invitation.role },
  });

  redirect("/dashboard");
}

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * notifications has no client insert policy (a user can only read/mark
 * their own) — every notification is created by trusted server code on
 * the recipient's behalf, so this always goes through the service-role
 * client even when called from an authenticated user's server action.
 */
export async function createNotification(params: {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    organization_id: params.organizationId,
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
  });
}

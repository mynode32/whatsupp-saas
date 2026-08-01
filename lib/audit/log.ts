import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * audit_logs has no client insert policy (append-only, service-role
 * only, per Faz 1's "never trust the client for audit trail
 * integrity" design) — always goes through the admin client, even
 * when called from an authenticated user's server action.
 */
export async function logAuditEvent(params: {
  organizationId: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    organization_id: params.organizationId,
    actor_id: params.actorId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });
}

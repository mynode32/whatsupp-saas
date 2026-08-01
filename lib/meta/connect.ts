import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/log";
import { subscribePageToMessaging, type MetaPageCandidate } from "@/lib/meta/graph";

export type { MetaPageCandidate };

/** Writes the chosen Page/Instagram account as this org's connected channel and subscribes it to inbound DMs. */
export async function connectInstagramCandidate(organizationId: string, userId: string, candidate: MetaPageCandidate) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("channel_connections")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("channel_type", "instagram")
    .maybeSingle();

  const fields = {
    channel_type: "instagram" as const,
    provider: "meta" as const,
    external_id: candidate.instagramAccountId,
    display_name: candidate.instagramUsername ? `Instagram (@${candidate.instagramUsername})` : `Instagram (${candidate.pageName})`,
    status: "connected" as const,
    last_event_at: new Date().toISOString(),
    last_error: null,
    created_by: userId,
  };

  const { data: channelRow, error } = existing
    ? await admin.from("channel_connections").update(fields).eq("id", existing.id).select("id").single()
    : await admin.from("channel_connections").insert({ ...fields, organization_id: organizationId }).select("id").single();
  if (error || !channelRow) {
    throw new Error(
      error?.code === "23505"
        ? "This Instagram account is already connected to another mynode account."
        : (error?.message ?? "Could not save the Instagram connection"),
    );
  }

  const { error: credError } = await admin.from("channel_instagram_credentials").upsert(
    {
      channel_connection_id: channelRow.id,
      organization_id: organizationId,
      page_id: candidate.pageId,
      page_access_token: candidate.pageAccessToken,
    },
    { onConflict: "channel_connection_id" },
  );
  if (credError) throw new Error(credError.message);

  await subscribePageToMessaging(candidate.pageId, candidate.pageAccessToken);

  await logAuditEvent({
    organizationId,
    actorId: userId,
    action: "connect_instagram_channel",
    targetType: "channel_connection",
    targetId: channelRow.id,
  });
}

import { NextResponse } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

type DeliveryStatus = "sent" | "delivered" | "read" | "failed";

const STATUS_MAP: Record<string, { status: DeliveryStatus; timestampField: "sent_at" | "delivered_at" | "read_at" | "failed_at" | null }> = {
  sent: { status: "sent", timestampField: "sent_at" },
  delivered: { status: "delivered", timestampField: "delivered_at" },
  read: { status: "read", timestampField: "read_at" },
  failed: { status: "failed", timestampField: "failed_at" },
  undelivered: { status: "failed", timestampField: "failed_at" },
};

/**
 * Twilio delivery-status callback for outbound messages (sent/delivered/read/failed).
 *
 * Each org has its own Twilio auth token (bring-your-own account, see
 * lib/actions/channels.ts), so there's no single shared secret to
 * validate against up front. We look up which org the referenced message
 * belongs to first — a read against our own data, not a trust decision —
 * then validate the signature against that org's stored token before
 * touching anything. An unknown MessageSid can't update any row either
 * way, so it's safe to no-op without a signature check.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const signature = request.headers.get("x-twilio-signature");
  const url = `${publicEnv.NEXT_PUBLIC_APP_URL}${new URL(request.url).pathname}`;
  const messageSid = params.MessageSid;
  const mapped = STATUS_MAP[params.MessageStatus];

  if (mapped && messageSid) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("messages")
      .select("id, status, organization_id")
      .eq("provider_message_id", messageSid)
      .maybeSingle();
    if (!existing) return new NextResponse(null, { status: 200 });

    const { data: channel } = await admin
      .from("channel_connections")
      .select("id")
      .eq("organization_id", existing.organization_id)
      .eq("channel_type", "whatsapp")
      .eq("provider", "twilio")
      .maybeSingle();
    const { data: secret } = channel
      ? await admin.from("channel_secrets").select("auth_token").eq("channel_connection_id", channel.id).maybeSingle()
      : { data: null };
    if (!signature || !secret || !twilio.validateRequest(secret.auth_token, signature, url, params)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const rank = { queued: 0, sent: 1, delivered: 2, read: 3, failed: 4 } as const;
    if (mapped.status !== "failed" && rank[mapped.status] < rank[existing.status]) {
      return new NextResponse(null, { status: 200 });
    }

    const update: MessageUpdate = { status: mapped.status };
    if (mapped.timestampField) update[mapped.timestampField] = new Date().toISOString();
    if (params.MessageStatus === "failed" || params.MessageStatus === "undelivered") {
      update.error_reason = params.ErrorMessage || `Twilio error ${params.ErrorCode ?? ""}`.trim();
    }
    await admin.from("messages").update(update).eq("id", existing.id);
  }

  return new NextResponse(null, { status: 200 });
}

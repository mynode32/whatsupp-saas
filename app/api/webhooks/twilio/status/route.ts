import { NextResponse } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";
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

/** Twilio delivery-status callback for outbound messages (sent/delivered/read/failed). */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const signature = request.headers.get("x-twilio-signature");
  const url = `${publicEnv.NEXT_PUBLIC_APP_URL}${new URL(request.url).pathname}`;

  if (!serverEnv.TWILIO_AUTH_TOKEN || !signature) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (!twilio.validateRequest(serverEnv.TWILIO_AUTH_TOKEN, signature, url, params)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const messageSid = params.MessageSid;
  const mapped = STATUS_MAP[params.MessageStatus];

  if (mapped) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("messages")
      .select("id, status")
      .eq("provider_message_id", messageSid)
      .maybeSingle();
    if (!existing) return new NextResponse(null, { status: 200 });

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

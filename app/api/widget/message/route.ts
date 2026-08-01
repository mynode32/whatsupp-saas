import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWidgetChannel, corsHeaders } from "@/lib/widget/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { runAutomationsForMessage } from "@/lib/automations/engine";

const bodySchema = z.object({
  widgetKey: z.string().min(1),
  visitorId: z.string().min(1),
  conversationId: z.uuid(),
  body: z.string().min(1).max(4096),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers });

  if (isRateLimited(`message:${parsed.data.visitorId}`)) {
    return NextResponse.json({ error: "Too many messages, slow down" }, { status: 429, headers });
  }

  const channel = await resolveWidgetChannel(parsed.data.widgetKey, origin);
  if (!channel) return NextResponse.json({ error: "Invalid widget key or origin" }, { status: 403, headers });

  const admin = createAdminClient();

  // Ownership check: this visitor must actually be the contact behind
  // this conversation, so one visitor can't post into another's chat.
  const { data: identity } = await admin
    .from("contact_identities")
    .select("contact_id")
    .eq("organization_id", channel.organization_id)
    .eq("channel", "web")
    .eq("external_id", parsed.data.visitorId)
    .maybeSingle();
  const { data: conversation } = await admin
    .from("conversations")
    .select("id, contact_id, unread_count")
    .eq("id", parsed.data.conversationId)
    .eq("organization_id", channel.organization_id)
    .maybeSingle();

  if (!identity || !conversation || conversation.contact_id !== identity.contact_id) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404, headers });
  }

  const { data: message, error } = await admin
    .from("messages")
    .insert({
      organization_id: channel.organization_id,
      conversation_id: conversation.id,
      direction: "inbound",
      sender_type: "contact",
      body: parsed.data.body,
      status: "delivered",
    })
    .select("id, created_at")
    .single();
  if (error || !message) return NextResponse.json({ error: "Could not send message" }, { status: 500, headers });

  await admin
    .from("conversations")
    .update({ last_message_at: new Date().toISOString(), unread_count: (conversation.unread_count ?? 0) + 1 })
    .eq("id", conversation.id);

  await runAutomationsForMessage(admin, {
    organizationId: channel.organization_id,
    conversationId: conversation.id,
    messageId: message.id,
    messageBody: parsed.data.body,
  });

  return NextResponse.json({ id: message.id, createdAt: message.created_at }, { headers });
}

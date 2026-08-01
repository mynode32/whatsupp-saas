import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWidgetChannel, corsHeaders } from "@/lib/widget/auth";

const querySchema = z.object({
  widgetKey: z.string().min(1),
  visitorId: z.string().min(1),
  conversationId: z.uuid(),
  since: z.string().optional(),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  const url = new URL(request.url);

  const parsed = querySchema.safeParse({
    widgetKey: url.searchParams.get("widgetKey"),
    visitorId: url.searchParams.get("visitorId"),
    conversationId: url.searchParams.get("conversationId"),
    since: url.searchParams.get("since") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers });

  const channel = await resolveWidgetChannel(parsed.data.widgetKey, origin);
  if (!channel) return NextResponse.json({ error: "Invalid widget key or origin" }, { status: 403, headers });

  const admin = createAdminClient();

  const { data: identity } = await admin
    .from("contact_identities")
    .select("contact_id")
    .eq("organization_id", channel.organization_id)
    .eq("channel", "web")
    .eq("external_id", parsed.data.visitorId)
    .maybeSingle();
  const { data: conversation } = await admin
    .from("conversations")
    .select("id, contact_id")
    .eq("id", parsed.data.conversationId)
    .eq("organization_id", channel.organization_id)
    .maybeSingle();

  if (!identity || !conversation || conversation.contact_id !== identity.contact_id) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404, headers });
  }

  let query = admin
    .from("messages")
    .select("id, direction, body, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });
  if (parsed.data.since) query = query.gt("created_at", parsed.data.since);

  const { data: messages } = await query;
  return NextResponse.json({ messages: messages ?? [] }, { headers });
}

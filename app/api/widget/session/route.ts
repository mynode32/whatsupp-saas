import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWidgetChannel, corsHeaders } from "@/lib/widget/auth";
import { isRateLimitedShared } from "@/lib/rate-limit.server";

const bodySchema = z.object({ widgetKey: z.uuid(), visitorId: z.uuid() });

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await isRateLimitedShared(`session:${ip}`)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });

  const channel = await resolveWidgetChannel(parsed.data.widgetKey, origin);
  if (!channel) return NextResponse.json({ error: "Invalid widget key or origin" }, { status: 403, headers });

  const admin = createAdminClient();

  const { data: existingIdentity } = await admin
    .from("contact_identities")
    .select("contact_id")
    .eq("organization_id", channel.organization_id)
    .eq("channel", "web")
    .eq("external_id", parsed.data.visitorId)
    .maybeSingle();

  let contactId = existingIdentity?.contact_id;
  if (!contactId) {
    const { data: newContact, error } = await admin
      .from("contacts")
      .insert({ organization_id: channel.organization_id, display_name: "Web visitor", primary_channel: "web" })
      .select("id")
      .single();
    if (error || !newContact) return NextResponse.json({ error: "Could not start session" }, { status: 500, headers });
    contactId = newContact.id;
    const { error: identityError } = await admin.from("contact_identities").insert({
      organization_id: channel.organization_id,
      contact_id: contactId,
      channel: "web",
      external_id: parsed.data.visitorId,
    });
    if (identityError?.code === "23505") {
      const { data: winner } = await admin
        .from("contact_identities")
        .select("contact_id")
        .eq("organization_id", channel.organization_id)
        .eq("channel", "web")
        .eq("external_id", parsed.data.visitorId)
        .single();
      await admin.from("contacts").delete().eq("id", contactId);
      contactId = winner?.contact_id;
    } else if (identityError) {
      await admin.from("contacts").delete().eq("id", contactId);
      return NextResponse.json({ error: "Could not start session" }, { status: 500, headers });
    }
  }

  if (!contactId) return NextResponse.json({ error: "Could not start session" }, { status: 500, headers });

  const { data: existingConversation } = await admin
    .from("conversations")
    .select("id")
    .eq("organization_id", channel.organization_id)
    .eq("contact_id", contactId)
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationId = existingConversation?.id;
  if (!conversationId) {
    const { data: newConversation, error } = await admin
      .from("conversations")
      .insert({ organization_id: channel.organization_id, contact_id: contactId, channel_connection_id: channel.id, status: "open" })
      .select("id")
      .single();
    if (error || !newConversation) return NextResponse.json({ error: "Could not start conversation" }, { status: 500, headers });
    conversationId = newConversation.id;
  }

  const { data: messages } = await admin
    .from("messages")
    .select("id, direction, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(50);

  await admin
    .from("channel_connections")
    .update({ last_event_at: new Date().toISOString() })
    .eq("id", channel.id);

  return NextResponse.json(
    {
      conversationId,
      welcomeMessage: channel.credentials && "welcomeMessage" in channel.credentials ? channel.credentials.welcomeMessage : null,
      color: channel.credentials && "color" in channel.credentials ? channel.credentials.color : null,
      messages: messages ?? [],
    },
    { headers },
  );
}

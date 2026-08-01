import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";
import { isValidMetaSignature } from "@/lib/meta/webhook";

type MetaMessageEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    is_self?: boolean;
    is_deleted?: boolean;
  };
};

type MetaPayload = {
  object?: string;
  entry?: Array<{ id?: string; messaging?: MetaMessageEvent[] }>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && challenge && token === serverEnv.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  if (!serverEnv.META_APP_SECRET) {
    return NextResponse.json({ error: "Meta integration is not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature || !isValidMetaSignature(rawBody, signature, serverEnv.META_APP_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: MetaPayload;
  try {
    payload = JSON.parse(rawBody) as MetaPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (payload.object !== "instagram") return new NextResponse(null, { status: 200 });

  try {
    for (const entry of payload.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        await processMessage(entry.id, event);
      }
    }
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}

async function processMessage(instagramAccountId: string | undefined, event: MetaMessageEvent) {
  const message = event.message;
  const senderId = event.sender?.id;
  if (
    !instagramAccountId ||
    !senderId ||
    !message?.mid ||
    !message.text ||
    message.is_echo ||
    message.is_self ||
    message.is_deleted
  ) return;

  const admin = createAdminClient();
  const { data: channel } = await admin
    .from("channel_connections")
    .select("id, organization_id")
    .eq("channel_type", "instagram")
    .eq("provider", "meta")
    .eq("external_id", instagramAccountId)
    .eq("status", "connected")
    .maybeSingle();
  if (!channel) throw new Error("Instagram channel not found");

  const { error: eventError } = await admin.from("webhook_events").insert({
    provider: "meta",
    external_event_id: message.mid,
    organization_id: channel.organization_id,
    payload: event as unknown as Record<string, unknown>,
    status: "processing",
  });
  if (eventError?.code === "23505") {
    const { data: existing } = await admin
      .from("webhook_events")
      .select("status")
      .eq("provider", "meta")
      .eq("external_event_id", message.mid)
      .maybeSingle();
    if (existing?.status !== "failed") return;
    await admin.from("webhook_events").update({ status: "processing", error_message: null })
      .eq("provider", "meta")
      .eq("external_event_id", message.mid);
  }
  if (eventError && eventError.code !== "23505") throw eventError;

  try {
    const { data: identity } = await admin
      .from("contact_identities")
      .select("contact_id")
      .eq("organization_id", channel.organization_id)
      .eq("channel", "instagram")
      .eq("external_id", senderId)
      .maybeSingle();

    let contactId = identity?.contact_id;
    if (!contactId) {
      const { data: contact, error } = await admin
        .from("contacts")
        .insert({ organization_id: channel.organization_id, display_name: "Instagram visitor", primary_channel: "instagram" })
        .select("id")
        .single();
      if (error || !contact) throw error ?? new Error("Could not create Instagram contact");
      contactId = contact.id;
      const { error: identityError } = await admin.from("contact_identities").insert({
        organization_id: channel.organization_id,
        contact_id: contactId,
        channel: "instagram",
        external_id: senderId,
      });
      if (identityError?.code === "23505") {
        const { data: winner } = await admin
          .from("contact_identities")
          .select("contact_id")
          .eq("organization_id", channel.organization_id)
          .eq("channel", "instagram")
          .eq("external_id", senderId)
          .single();
        await admin.from("contacts").delete().eq("id", contactId);
        contactId = winner?.contact_id;
      } else if (identityError) {
        throw identityError;
      }
    }

    if (!contactId) throw new Error("Could not resolve Instagram contact");

    const { data: openConversation } = await admin
      .from("conversations")
      .select("id")
      .eq("organization_id", channel.organization_id)
      .eq("contact_id", contactId)
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let conversationId = openConversation?.id;
    if (!conversationId) {
      const { data: conversation, error } = await admin
        .from("conversations")
        .insert({
          organization_id: channel.organization_id,
          contact_id: contactId,
          channel_connection_id: channel.id,
          status: "open",
        })
        .select("id")
        .single();
      if (error || !conversation) throw error ?? new Error("Could not create Instagram conversation");
      conversationId = conversation.id;
    }

    const { error: messageError } = await admin.from("messages").insert({
      organization_id: channel.organization_id,
      conversation_id: conversationId,
      direction: "inbound",
      sender_type: "contact",
      body: message.text,
      provider_message_id: message.mid,
      status: "delivered",
    });
    if (messageError && messageError.code !== "23505") throw messageError;

    await admin.rpc("record_inbound_activity", { target_conversation_id: conversationId });
    await admin.from("webhook_events").update({
      status: "processed",
      processed_at: new Date().toISOString(),
      contact_id: contactId,
    }).eq("provider", "meta").eq("external_event_id", message.mid);
  } catch (error) {
    await admin.from("webhook_events").update({
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
    }).eq("provider", "meta").eq("external_event_id", message.mid);
    throw error;
  }
}

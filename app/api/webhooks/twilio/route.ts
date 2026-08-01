import { NextResponse } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";
import { publicEnv } from "@/lib/env";
import { runAutomationsForMessage } from "@/lib/automations/engine";

/**
 * Twilio WhatsApp inbound message webhook.
 *
 * Always responds 2xx once the signature check passes, even on
 * downstream errors, so Twilio doesn't retry-storm us — errors are
 * logged to webhook_events.status='failed' for follow-up instead.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const signature = request.headers.get("x-twilio-signature");
  // Signature is computed over the *public* URL Twilio actually called
  // (configured in the console), not whatever host Node sees behind a
  // tunnel/proxy — reconstruct it from NEXT_PUBLIC_APP_URL.
  const url = `${publicEnv.NEXT_PUBLIC_APP_URL}${new URL(request.url).pathname}`;

  if (!serverEnv.TWILIO_AUTH_TOKEN || !signature) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const validSignature = twilio.validateRequest(serverEnv.TWILIO_AUTH_TOKEN, signature, url, params);
  if (!validSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const messageSid = params.MessageSid;
  const from = params.From; // e.g. "whatsapp:+15551234567"
  const to = params.To; // e.g. "whatsapp:+14155238886"
  const body = params.Body ?? "";

  const admin = createAdminClient();

  // Log every valid webhook, deduped by (provider, external_event_id).
  const { error: logError } = await admin.from("webhook_events").insert({
    provider: "twilio",
    external_event_id: messageSid,
    payload: params,
    status: "processing",
  });
  if (logError) {
    // Duplicate delivery of a webhook we already logged — already handled, ack and stop.
    if (logError.code === "23505") return new NextResponse(null, { status: 200 });
    return NextResponse.json({ error: "Failed to log webhook" }, { status: 500 });
  }

  try {
    // A shared Twilio Sandbox number can't disambiguate orgs by "To" —
    // this picks the first connected WhatsApp channel. With real
    // per-org purchased numbers (post-Sandbox), external_id uniquely
    // identifies the org and this becomes an exact match.
    const { data: channel } = await admin
      .from("channel_connections")
      .select("id, organization_id")
      .eq("channel_type", "whatsapp")
      .eq("provider", "twilio")
      .eq("status", "connected")
      .eq("external_id", to)
      .limit(1)
      .maybeSingle();

    if (!channel) throw new Error(`No connected WhatsApp channel for ${to}`);

    const { organization_id: organizationId, id: channelConnectionId } = channel;

    const { data: contact } = await admin
      .from("contact_identities")
      .select("contact_id")
      .eq("organization_id", organizationId)
      .eq("channel", "whatsapp")
      .eq("external_id", from)
      .maybeSingle();

    let contactId = contact?.contact_id;
    if (!contactId) {
      const { data: newContact, error: contactError } = await admin
        .from("contacts")
        .insert({ organization_id: organizationId, display_name: from.replace("whatsapp:", ""), primary_channel: "whatsapp" })
        .select("id")
        .single();
      if (contactError) throw contactError;
      contactId = newContact.id;

      await admin.from("contact_identities").insert({
        organization_id: organizationId,
        contact_id: contactId,
        channel: "whatsapp",
        external_id: from,
      });
    }

    const { data: openConversation } = await admin
      .from("conversations")
      .select("id, unread_count")
      .eq("organization_id", organizationId)
      .eq("contact_id", contactId)
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let conversationId = openConversation?.id;
    if (!conversationId) {
      const { data: newConversation, error: convError } = await admin
        .from("conversations")
        .insert({
          organization_id: organizationId,
          contact_id: contactId,
          channel_connection_id: channelConnectionId,
          status: "open",
          unread_count: 0,
        })
        .select("id")
        .single();
      if (convError) throw convError;
      conversationId = newConversation.id;
    }

    const { error: messageError } = await admin.from("messages").insert({
      organization_id: organizationId,
      conversation_id: conversationId,
      direction: "inbound",
      sender_type: "contact",
      body,
      provider_message_id: messageSid,
      status: "delivered",
    });
    // Duplicate MessageSid (Twilio retried the same message) — not an error,
    // but skip re-running automations for it (already ran the first time).
    if (messageError && messageError.code !== "23505") throw messageError;
    if (!messageError) {
      await runAutomationsForMessage(admin, { organizationId, conversationId, messageId: messageSid, messageBody: body });
    }

    await admin
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        unread_count: (openConversation?.unread_count ?? 0) + 1,
      })
      .eq("id", conversationId);

    await admin
      .from("channel_connections")
      .update({ last_event_at: new Date().toISOString() })
      .eq("id", channelConnectionId);

    await admin
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString(), organization_id: organizationId })
      .eq("provider", "twilio")
      .eq("external_event_id", messageSid);
  } catch (err) {
    await admin
      .from("webhook_events")
      .update({ status: "failed", error_message: err instanceof Error ? err.message : "Unknown error" })
      .eq("provider", "twilio")
      .eq("external_event_id", messageSid);
  }

  // Always 2xx once signature-verified: failures are tracked in
  // webhook_events for retry/inspection, not surfaced to Twilio.
  return new NextResponse(null, { status: 200 });
}

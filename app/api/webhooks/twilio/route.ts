import { NextResponse } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { runAutomationsForMessage } from "@/lib/automations/engine";

/**
 * Twilio WhatsApp inbound message webhook.
 *
 * Each organization brings its own Twilio account (lib/actions/channels.ts),
 * so there's no single shared auth token to validate against. The "To"
 * number picks which organization's channel this claims to be for, and
 * *that* org's own stored auth token is what verifies the signature —
 * an unrecognized number is rejected before any secret lookup happens, and
 * a forged signature for a real number still fails without that org's
 * actual token.
 *
 * Acknowledges only successfully processed events. Downstream failures
 * return 500 so Twilio can retry; failed duplicates re-enter processing.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const signature = request.headers.get("x-twilio-signature");
  // Signature is computed over the *public* URL Twilio actually called
  // (configured in the console), not whatever host Node sees behind a
  // tunnel/proxy — reconstruct it from NEXT_PUBLIC_APP_URL.
  const url = `${publicEnv.NEXT_PUBLIC_APP_URL}${new URL(request.url).pathname}`;

  const messageSid = params.MessageSid;
  const from = params.From; // e.g. "whatsapp:+15551234567"
  const to = params.To; // e.g. "whatsapp:+14155238886"
  const body = params.Body ?? "";

  if (!signature || !to) {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: channel } = await admin
    .from("channel_connections")
    .select("id, organization_id")
    .eq("channel_type", "whatsapp")
    .eq("provider", "twilio")
    .eq("status", "connected")
    .eq("external_id", to)
    .maybeSingle();
  if (!channel) return NextResponse.json({ error: "No connected WhatsApp channel for this number" }, { status: 404 });

  const { data: secret } = await admin
    .from("channel_secrets")
    .select("auth_token")
    .eq("channel_connection_id", channel.id)
    .maybeSingle();
  if (!secret) return NextResponse.json({ error: "Channel not fully configured" }, { status: 500 });

  const validSignature = twilio.validateRequest(secret.auth_token, signature, url, params);
  if (!validSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // Log every valid webhook, deduped by (provider, external_event_id).
  const { error: logError } = await admin.from("webhook_events").insert({
    provider: "twilio",
    external_event_id: messageSid,
    payload: params,
    status: "processing",
  });
  if (logError) {
    // Duplicate delivery of a webhook we already logged — already handled, ack and stop.
    if (logError.code === "23505") {
      const { data: existing } = await admin
        .from("webhook_events")
        .select("status")
        .eq("provider", "twilio")
        .eq("external_event_id", messageSid)
        .maybeSingle();
      if (existing?.status !== "failed") return new NextResponse(null, { status: 200 });
      await admin
        .from("webhook_events")
        .update({ status: "processing", error_message: null })
        .eq("provider", "twilio")
        .eq("external_event_id", messageSid);
    } else {
      return NextResponse.json({ error: "Failed to log webhook" }, { status: 500 });
    }
  }

  try {
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

      const { error: identityError } = await admin.from("contact_identities").insert({
        organization_id: organizationId,
        contact_id: contactId,
        channel: "whatsapp",
        external_id: from,
      });
      if (identityError?.code === "23505") {
        const { data: winner } = await admin
          .from("contact_identities")
          .select("contact_id")
          .eq("organization_id", organizationId)
          .eq("channel", "whatsapp")
          .eq("external_id", from)
          .single();
        await admin.from("contacts").delete().eq("id", contactId);
        contactId = winner?.contact_id;
      } else if (identityError) {
        throw identityError;
      }
    }

    if (!contactId) throw new Error("Could not resolve contact");

    const { data: openConversation } = await admin
      .from("conversations")
      .select("id")
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

    await admin.rpc("record_inbound_activity", { target_conversation_id: conversationId });

    await admin
      .from("channel_connections")
      .update({ last_event_at: new Date().toISOString() })
      .eq("id", channelConnectionId);

    await admin
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString(), organization_id: organizationId, contact_id: contactId, error_message: null })
      .eq("provider", "twilio")
      .eq("external_event_id", messageSid);
  } catch (err) {
    await admin
      .from("webhook_events")
      .update({ status: "failed", error_message: err instanceof Error ? err.message : "Unknown error" })
      .eq("provider", "twilio")
      .eq("external_event_id", messageSid);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  // Always 2xx once signature-verified: failures are tracked in
  // webhook_events for retry/inspection, not surfaced to Twilio.
  return new NextResponse(null, { status: 200 });
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTwilioClient } from "@/lib/twilio/client";
import { publicEnv } from "@/lib/env";
import { isRateLimitedShared } from "@/lib/rate-limit.server";
import type { AuthActionState } from "@/lib/actions/auth";

const sendSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().min(1, "Message can't be empty").max(4096),
});

export async function sendMessageAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = sendSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (await isRateLimitedShared(`send:${user.id}`, 30)) {
    return { error: "Sending too fast — slow down a bit." };
  }

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, organization_id, contact_id, channel_connection_id, first_response_at")
    .eq("id", parsed.data.conversationId)
    .single();
  if (convError || !conversation) return { error: "Conversation not found" };

  const { data: channel } = conversation.channel_connection_id
    ? await supabase
        .from("channel_connections")
        .select("channel_type, external_id")
        .eq("id", conversation.channel_connection_id)
        .maybeSingle()
    : { data: null };
  if (!channel) return { error: "This conversation has no active channel" };

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      organization_id: conversation.organization_id,
      conversation_id: conversation.id,
      direction: "outbound",
      sender_type: "agent",
      sender_id: user.id,
      body: parsed.data.body,
      status: "queued",
    })
    .select("id")
    .single();
  if (insertError || !message) return { error: insertError?.message ?? "Could not save message" };

  try {
    if (channel.channel_type === "whatsapp") {
      const { data: identity } = await supabase
        .from("contact_identities")
        .select("external_id")
        .eq("organization_id", conversation.organization_id)
        .eq("contact_id", conversation.contact_id)
        .eq("channel", "whatsapp")
        .maybeSingle();
      if (!identity) throw new Error("This contact has no WhatsApp number on file");

      const admin = createAdminClient();
      const { data: secret } = await admin
        .from("channel_secrets")
        .select("account_sid, auth_token")
        .eq("channel_connection_id", conversation.channel_connection_id!)
        .maybeSingle();
      if (!secret) throw new Error("This organization hasn't connected a WhatsApp number yet");

      const client = createTwilioClient(secret.account_sid, secret.auth_token);
      const twilioMessage = await client.messages.create({
        from: channel.external_id!,
        to: identity.external_id,
        body: parsed.data.body,
        statusCallback: `${publicEnv.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
      });

      await supabase
        .from("messages")
        .update({ provider_message_id: twilioMessage.sid, status: "sent", sent_at: new Date().toISOString() })
        .eq("id", message.id);
    } else if (channel.channel_type === "web") {
      await supabase
        .from("messages")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", message.id);
    } else {
      throw new Error(`Sending through ${channel.channel_type} is not available yet`);
    }
  } catch (err) {
    await supabase
      .from("messages")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_reason: err instanceof Error ? err.message : "Channel send failed",
      })
      .eq("id", message.id);
    revalidatePath("/conversations");
    return { error: err instanceof Error ? err.message : "Failed to send message" };
  }

  const now = new Date().toISOString();
  await supabase
    .from("conversations")
    .update({
      last_message_at: now,
      first_response_at: conversation.first_response_at ?? now,
    })
    .eq("id", conversation.id);

  revalidatePath(`/conversations`);
  return { success: true };
}

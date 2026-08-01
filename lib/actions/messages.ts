"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTwilioClient } from "@/lib/twilio/client";
import { serverEnv } from "@/lib/env.server";
import { publicEnv } from "@/lib/env";
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

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, organization_id, contact_id")
    .eq("id", parsed.data.conversationId)
    .single();
  if (convError || !conversation) return { error: "Conversation not found" };

  const { data: identity } = await supabase
    .from("contact_identities")
    .select("external_id")
    .eq("contact_id", conversation.contact_id)
    .eq("channel", "whatsapp")
    .maybeSingle();
  if (!identity) return { error: "This contact has no WhatsApp number on file" };

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
    const client = createTwilioClient();
    const twilioMessage = await client.messages.create({
      from: serverEnv.TWILIO_WHATSAPP_FROM!,
      to: identity.external_id,
      body: parsed.data.body,
      statusCallback: `${publicEnv.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
    });

    await supabase
      .from("messages")
      .update({ provider_message_id: twilioMessage.sid, status: "sent", sent_at: new Date().toISOString() })
      .eq("id", message.id);
  } catch (err) {
    await supabase
      .from("messages")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_reason: err instanceof Error ? err.message : "Twilio send failed",
      })
      .eq("id", message.id);
    return { error: err instanceof Error ? err.message : "Failed to send message" };
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  revalidatePath(`/conversations`);
  return { success: true };
}

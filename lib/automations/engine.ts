import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, AutomationAction } from "@/lib/supabase/types";
import { createTwilioClient } from "@/lib/twilio/client";
import { serverEnv } from "@/lib/env.server";
import { publicEnv } from "@/lib/env";
import { isWithinBusinessHours } from "@/lib/automations/business-hours";

type AdminClient = SupabaseClient<Database>;
type BusinessHour = Database["public"]["Tables"]["business_hours"]["Row"];

async function executeAction(
  admin: AdminClient,
  action: AutomationAction,
  ctx: { organizationId: string; conversationId: string },
) {
  if (action.type === "reply") {
    const { data: conversation } = await admin
      .from("conversations")
      .select("contact_id, channel_connection_id")
      .eq("id", ctx.conversationId)
      .single();
    if (!conversation) throw new Error("Conversation not found");

    const channelType = conversation.channel_connection_id
      ? (await admin.from("channel_connections").select("channel_type").eq("id", conversation.channel_connection_id).single()).data
          ?.channel_type
      : null;

    const { data: message } = await admin
      .from("messages")
      .insert({
        organization_id: ctx.organizationId,
        conversation_id: ctx.conversationId,
        direction: "outbound",
        sender_type: "system",
        body: action.body,
        status: "queued",
      })
      .select("id")
      .single();
    if (!message) throw new Error("Could not queue automation reply");

    if (channelType === "whatsapp") {
      const { data: identity } = await admin
        .from("contact_identities")
        .select("external_id")
        .eq("contact_id", conversation.contact_id)
        .eq("channel", "whatsapp")
        .maybeSingle();
      if (!identity) {
        await admin.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error_reason: "Contact has no WhatsApp number" }).eq("id", message.id);
        throw new Error("Contact has no WhatsApp number");
      }
      try {
        const client = createTwilioClient();
        const twilioMessage = await client.messages.create({
          from: serverEnv.TWILIO_WHATSAPP_FROM!,
          to: identity.external_id,
          body: action.body,
          statusCallback: `${publicEnv.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
        });
        await admin
          .from("messages")
          .update({ provider_message_id: twilioMessage.sid, status: "sent", sent_at: new Date().toISOString() })
          .eq("id", message.id);
      } catch (err) {
        await admin
          .from("messages")
          .update({
            status: "failed",
            failed_at: new Date().toISOString(),
            error_reason: err instanceof Error ? err.message : "Twilio send failed",
          })
          .eq("id", message.id);
        throw err;
      }
    } else {
      // Web chat (and any future first-party channel): no external
      // provider to call — the reply just lands in the messages table
      // and the widget picks it up on its next poll.
      await admin.from("messages").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", message.id);
    }

    await admin.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", ctx.conversationId);
  } else if (action.type === "tag") {
    const { data: existingTag } = await admin
      .from("tags")
      .select("id")
      .eq("organization_id", ctx.organizationId)
      .eq("name", action.tagName)
      .maybeSingle();
    const tagId =
      existingTag?.id ??
      (await admin.from("tags").insert({ organization_id: ctx.organizationId, name: action.tagName }).select("id").single()).data?.id;
    if (!tagId) throw new Error("Could not resolve tag");
    await admin.from("conversation_tags").insert({ organization_id: ctx.organizationId, conversation_id: ctx.conversationId, tag_id: tagId });
  } else if (action.type === "assign") {
    await admin.from("conversations").update({ assigned_to: action.memberId }).eq("id", ctx.conversationId);
  }
}

/**
 * Evaluates active rules against one inbound message and runs matching
 * ones. Called once per inbound webhook message — never re-evaluated
 * against the outbound replies automations themselves create, so
 * there's no risk of a rule re-triggering itself into a loop.
 */
export async function runAutomationsForMessage(
  admin: AdminClient,
  params: { organizationId: string; conversationId: string; messageId: string; messageBody: string },
) {
  const { organizationId, conversationId, messageId, messageBody } = params;

  const { data: rules } = await admin
    .from("automation_rules")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("priority", { ascending: false });
  if (!rules || rules.length === 0) return;

  let businessHours: BusinessHour[] | null = null;
  let orgTimezone: string | null = null;

  for (const rule of rules) {
    let matched = false;

    if (rule.trigger_type === "keyword") {
      const keywords = rule.conditions?.keywords ?? [];
      const lowerBody = messageBody.toLowerCase();
      matched = keywords.some((k) => lowerBody.includes(k.toLowerCase()));
    } else if (rule.trigger_type === "off_hours") {
      if (businessHours === null) {
        const [{ data: hours }, { data: org }] = await Promise.all([
          admin.from("business_hours").select("*").eq("organization_id", organizationId),
          admin.from("organizations").select("timezone").eq("id", organizationId).single(),
        ]);
        businessHours = hours ?? [];
        orgTimezone = org?.timezone ?? "UTC";
      }
      matched = !isWithinBusinessHours(businessHours, new Date(), orgTimezone ?? "UTC");
    }
    if (!matched) continue;

    if (rule.max_runs_per_conversation != null) {
      const { count } = await admin
        .from("automation_runs")
        .select("id", { count: "exact", head: true })
        .eq("rule_id", rule.id)
        .eq("conversation_id", conversationId);
      if ((count ?? 0) >= rule.max_runs_per_conversation) continue;
    }
    if (rule.cooldown_seconds != null && rule.last_run_at) {
      const elapsedSeconds = (Date.now() - new Date(rule.last_run_at).getTime()) / 1000;
      if (elapsedSeconds < rule.cooldown_seconds) continue;
    }

    // One run per (rule, message) — the unique constraint is the real
    // guard; a duplicate insert here means this exact message already
    // triggered this rule (e.g. a retried webhook), so skip quietly.
    const { data: run, error: runError } = await admin
      .from("automation_runs")
      .insert({ organization_id: organizationId, rule_id: rule.id, conversation_id: conversationId, trigger_event_id: messageId, status: "success" })
      .select("id")
      .single();
    if (runError || !run) continue;

    try {
      for (const action of rule.actions ?? []) {
        await executeAction(admin, action, { organizationId, conversationId });
        await admin.from("automation_actions").insert({
          organization_id: organizationId,
          run_id: run.id,
          action_type: action.type,
          payload: action,
          status: "success",
        });
      }
      await admin.from("automation_rules").update({ last_run_at: new Date().toISOString() }).eq("id", rule.id);
    } catch (err) {
      await admin
        .from("automation_runs")
        .update({ status: "failed", error_message: err instanceof Error ? err.message : "Unknown error", finished_at: new Date().toISOString() })
        .eq("id", run.id);
    }
  }
}

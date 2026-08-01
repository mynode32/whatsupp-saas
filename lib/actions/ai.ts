"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimitedShared } from "@/lib/rate-limit.server";
import { detectSensitiveData } from "@/lib/ai/sensitive";
import { findGroundingChunks } from "@/lib/ai/retrieval";
import { generateChatCompletion, resolveAiProvider } from "@/lib/ai/provider";

export type AiSuggestionResult =
  | { status: "ok"; draftId: string; text: string; citations: { title: string }[] }
  | { status: "no_grounding" }
  | { status: "sensitive_data" }
  | { status: "not_configured" }
  | { status: "error"; message: string };

/**
 * Drafts a reply to the conversation's latest customer message, grounded
 * only in this org's published knowledge base — never freehand. No
 * grounding found means no draft: the agent writes it themselves rather
 * than getting an AI guess presented as fact. A message containing
 * card/IBAN/national-ID data skips the AI provider entirely.
 */
export async function generateSuggestedReplyAction(conversationId: string): Promise<AiSuggestionResult> {
  const provider = resolveAiProvider();
  if (!provider) return { status: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in" };

  if (await isRateLimitedShared(`ai-suggest:${user.id}`, 20)) {
    return { status: "error", message: "Too many requests — slow down a bit." };
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, organization_id")
    .eq("id", conversationId)
    .single();
  if (!conversation) return { status: "error", message: "Conversation not found" };

  const { data: org } = await supabase
    .from("organizations")
    .select("name, brand_voice, default_lang")
    .eq("id", conversation.organization_id)
    .single();
  if (!org) return { status: "error", message: "Organization not found" };

  const { data: lastInbound } = await supabase
    .from("messages")
    .select("id, body")
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lastInbound?.body) return { status: "error", message: "No customer message to reply to" };

  const sensitive = detectSensitiveData(lastInbound.body);
  if (sensitive.detected) return { status: "sensitive_data" };

  const admin = createAdminClient();
  const chunks = await findGroundingChunks(admin, conversation.organization_id, lastInbound.body, 4);
  if (chunks.length === 0) return { status: "no_grounding" };

  const langLabel = org.default_lang === "tr" ? "Turkish" : "English";
  const system = [
    `You are a customer support assistant for "${org.name}".`,
    org.brand_voice ? `Brand voice: ${org.brand_voice}.` : null,
    "Answer ONLY using the knowledge base excerpts below — never invent facts, prices, policies, order numbers, or dates that aren't in them.",
    "If the excerpts don't fully answer the question, say so plainly instead of guessing.",
    `Reply in ${langLabel}. Keep it concise, warm, and ready to send as-is — no meta-commentary, no "as an AI" disclaimers.`,
    "",
    "Knowledge base excerpts:",
    ...chunks.map((c, i) => `[${i + 1}] (${c.documentTitle}) ${c.content}`),
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  let completion;
  try {
    completion = await generateChatCompletion({ system, user: lastInbound.body });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "AI provider request failed" };
  }
  if (!completion.text) return { status: "error", message: "AI provider returned an empty response" };

  const citations = [...new Set(chunks.map((c) => c.documentTitle))].map((title) => ({ title }));

  const { data: draft, error: draftError } = await admin
    .from("ai_reply_drafts")
    .insert({
      organization_id: conversation.organization_id,
      conversation_id: conversationId,
      message_id: lastInbound.id,
      draft: completion.text,
      citations,
      status: "pending",
    })
    .select("id")
    .single();
  if (draftError || !draft) return { status: "error", message: draftError?.message ?? "Could not save the draft" };

  await admin.from("ai_usage_events").insert({
    organization_id: conversation.organization_id,
    conversation_id: conversationId,
    model: completion.model,
    input_tokens: completion.inputTokens,
    output_tokens: completion.outputTokens,
  });

  return { status: "ok", draftId: draft.id, text: completion.text, citations };
}

const reviewSchema = z.object({
  draftId: z.uuid(),
  status: z.enum(["approved", "edited", "rejected", "sent"]),
  messageId: z.uuid().optional(),
});

/** Records what actually happened to a draft (used as-is, edited, discarded) — powers the ai_reply_drafts.status funnel. */
export async function reviewAiDraftAction(input: z.infer<typeof reviewSchema>) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("ai_reply_drafts")
    .update({
      status: parsed.data.status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      ...(parsed.data.messageId ? { message_id: parsed.data.messageId } : {}),
    })
    .eq("id", parsed.data.draftId);
}

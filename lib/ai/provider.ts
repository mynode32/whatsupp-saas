import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { serverEnv } from "@/lib/env.server";

export type AiProviderName = "anthropic" | "openai";

/**
 * Which provider actually answers a request. AI_PROVIDER only matters when
 * both keys are configured; otherwise whichever key exists wins, so an org
 * can drop in either an Anthropic or an OpenAI key with zero code changes.
 */
export function resolveAiProvider(): AiProviderName | null {
  const hasAnthropic = Boolean(serverEnv.ANTHROPIC_API_KEY);
  const hasOpenAi = Boolean(serverEnv.OPENAI_API_KEY);
  if (serverEnv.AI_PROVIDER === "anthropic" && hasAnthropic) return "anthropic";
  if (serverEnv.AI_PROVIDER === "openai" && hasOpenAi) return "openai";
  if (hasAnthropic) return "anthropic";
  if (hasOpenAi) return "openai";
  return null;
}

export type ChatCompletionResult = {
  text: string;
  provider: AiProviderName;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export async function generateChatCompletion(params: { system: string; user: string }): Promise<ChatCompletionResult> {
  const provider = resolveAiProvider();
  if (!provider) throw new Error("No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.");

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY! });
    const model = serverEnv.ANTHROPIC_MODEL;
    const response = await client.messages.create({
      model,
      max_tokens: 600,
      system: params.system,
      messages: [{ role: "user", content: params.user }],
    });
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return {
      text,
      provider,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }

  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY! });
  const model = serverEnv.OPENAI_MODEL;
  const response = await client.chat.completions.create({
    model,
    max_tokens: 600,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  });
  return {
    text: response.choices[0]?.message?.content?.trim() ?? "",
    provider,
    model,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  };
}

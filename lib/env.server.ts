import "server-only";
import { z } from "zod";

/**
 * Server-only environment variables — secrets. The `server-only` import
 * makes any accidental client-component import fail at build time, so
 * SUPABASE_SERVICE_ROLE_KEY (and friends) can never reach the browser.
 */
const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-4-5"),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_WHATSAPP_FROM: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
});

/** Empty-string env vars (e.g. `KEY=` left blank by setup) count as unset, not invalid. */
function emptyToUndefined(v: string | undefined) {
  return v === "" ? undefined : v;
}

function parseServerEnv() {
  const parsed = serverSchema.safeParse({
    ANTHROPIC_API_KEY: emptyToUndefined(process.env.ANTHROPIC_API_KEY),
    ANTHROPIC_MODEL: emptyToUndefined(process.env.ANTHROPIC_MODEL),
    TWILIO_ACCOUNT_SID: emptyToUndefined(process.env.TWILIO_ACCOUNT_SID),
    TWILIO_AUTH_TOKEN: emptyToUndefined(process.env.TWILIO_AUTH_TOKEN),
    TWILIO_WHATSAPP_FROM: emptyToUndefined(process.env.TWILIO_WHATSAPP_FROM),
    SUPABASE_SERVICE_ROLE_KEY: emptyToUndefined(process.env.SUPABASE_SERVICE_ROLE_KEY),
    WEBHOOK_SIGNING_SECRET: emptyToUndefined(process.env.WEBHOOK_SIGNING_SECRET),
  });
  if (!parsed.success) {
    // Never interpolate raw env values here — only field names/messages.
    throw new Error(
      `Invalid server environment variables:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`,
    );
  }
  return parsed.data;
}

export const serverEnv = parseServerEnv();

export const integrationStatus = {
  anthropic: Boolean(serverEnv.ANTHROPIC_API_KEY),
  twilio: Boolean(serverEnv.TWILIO_ACCOUNT_SID && serverEnv.TWILIO_AUTH_TOKEN),
  supabase: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
} as const;

import "server-only";
import twilio from "twilio";
import { serverEnv } from "@/lib/env.server";

export function isTwilioConfigured() {
  return Boolean(serverEnv.TWILIO_ACCOUNT_SID && serverEnv.TWILIO_AUTH_TOKEN && serverEnv.TWILIO_WHATSAPP_FROM);
}

/**
 * Each organization connects its own Twilio account (see
 * lib/actions/channels.ts), so callers pass that org's stored
 * account_sid/auth_token. Falling back to the operator's own .env.local
 * credentials only supports local development before any org has
 * connected a real number.
 */
export function createTwilioClient(accountSid?: string, authToken?: string) {
  const sid = accountSid ?? serverEnv.TWILIO_ACCOUNT_SID;
  const token = authToken ?? serverEnv.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error("Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local.");
  }
  return twilio(sid, token);
}

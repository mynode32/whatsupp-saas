import "server-only";
import twilio from "twilio";
import { serverEnv } from "@/lib/env.server";

export function isTwilioConfigured() {
  return Boolean(serverEnv.TWILIO_ACCOUNT_SID && serverEnv.TWILIO_AUTH_TOKEN && serverEnv.TWILIO_WHATSAPP_FROM);
}

export function createTwilioClient() {
  if (!serverEnv.TWILIO_ACCOUNT_SID || !serverEnv.TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local.");
  }
  return twilio(serverEnv.TWILIO_ACCOUNT_SID, serverEnv.TWILIO_AUTH_TOKEN);
}

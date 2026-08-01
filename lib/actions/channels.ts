"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTwilioClient, isTwilioConfigured } from "@/lib/twilio/client";
import { serverEnv } from "@/lib/env.server";
import { createNotification } from "@/lib/notifications/create";
import { logAuditEvent } from "@/lib/audit/log";
import type { AuthActionState } from "@/lib/actions/auth";

const connectSchema = z.object({ organizationId: z.uuid() });

/**
 * Tests the Twilio credentials from .env.local and records connection
 * status on the org's channel_connections row. Credentials are global
 * (one Twilio account) for now, not per-org — see the schema comment
 * in 0003_channels_contacts.sql on why per-org secret storage is
 * deliberately deferred.
 */
export async function connectTwilioAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = connectSchema.safeParse({ organizationId: formData.get("organizationId") });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (!isTwilioConfigured()) {
    return { error: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM must be set in .env.local first." };
  }

  let status: "connected" | "error" = "connected";
  let lastError: string | null = null;

  try {
    const client = createTwilioClient();
    await client.api.v2010.accounts(serverEnv.TWILIO_ACCOUNT_SID!).fetch();
  } catch (err) {
    status = "error";
    lastError = err instanceof Error ? err.message : "Unknown Twilio error";
  }

  const { data: existing } = await supabase
    .from("channel_connections")
    .select("id")
    .eq("organization_id", parsed.data.organizationId)
    .eq("channel_type", "whatsapp")
    .maybeSingle();

  const fields = {
    channel_type: "whatsapp" as const,
    provider: "twilio" as const,
    external_id: serverEnv.TWILIO_WHATSAPP_FROM,
    display_name: `WhatsApp (${serverEnv.TWILIO_WHATSAPP_FROM})`,
    status,
    last_event_at: new Date().toISOString(),
    last_error: lastError,
    created_by: user.id,
  };

  const { error } = existing
    ? await supabase.from("channel_connections").update(fields).eq("id", existing.id)
    : await supabase.from("channel_connections").insert({ ...fields, organization_id: parsed.data.organizationId });

  if (error) return { error: error.message };

  await logAuditEvent({
    organizationId: parsed.data.organizationId,
    actorId: user.id,
    action: "connect_whatsapp_channel",
    targetType: "channel_connection",
    metadata: { status },
  });

  if (status === "error") {
    const { data: admins } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", parsed.data.organizationId)
      .in("role", ["owner", "admin"]);
    for (const admin of admins ?? []) {
      await createNotification({
        organizationId: parsed.data.organizationId,
        userId: admin.user_id,
        type: "channel_error",
        title: "WhatsApp connection failed",
        body: lastError ?? undefined,
        link: "/settings",
      });
    }
  }

  revalidatePath("/settings");
  return status === "connected" ? { success: true } : { error: lastError ?? "Connection failed" };
}

const webChannelSchema = z.object({
  organizationId: z.uuid(),
  welcomeMessage: z.string().optional(),
  color: z.string().optional(),
  allowedOrigins: z.string().optional(),
});

/** Creates (or reconfigures) the org's web chat widget — generates the public widget key on first setup. */
export async function createWebChannelAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = webChannelSchema.safeParse({
    organizationId: formData.get("organizationId"),
    welcomeMessage: formData.get("welcomeMessage") || undefined,
    color: formData.get("color") || undefined,
    allowedOrigins: formData.get("allowedOrigins") || undefined,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const credentials = {
    welcomeMessage: parsed.data.welcomeMessage ?? "Merhaba! Nasıl yardımcı olabiliriz?",
    color: parsed.data.color ?? "#4f46e5",
    allowedOrigins: parsed.data.allowedOrigins
      ? parsed.data.allowedOrigins.split(",").map((o) => o.trim()).filter(Boolean)
      : [],
  };

  const { data: existing } = await supabase
    .from("channel_connections")
    .select("id, external_id")
    .eq("organization_id", parsed.data.organizationId)
    .eq("channel_type", "web")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("channel_connections").update({ credentials, status: "connected" }).eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const widgetKey = crypto.randomUUID();
    const { error } = await supabase.from("channel_connections").insert({
      organization_id: parsed.data.organizationId,
      channel_type: "web",
      provider: "native",
      external_id: widgetKey,
      display_name: "Web chat widget",
      credentials,
      status: "connected",
      created_by: user.id,
    });
    if (error) return { error: error.message };
  }

  await logAuditEvent({
    organizationId: parsed.data.organizationId,
    actorId: user.id,
    action: "configure_web_channel",
    targetType: "channel_connection",
  });

  revalidatePath("/settings");
  return { success: true };
}

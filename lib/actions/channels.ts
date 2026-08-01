"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTwilioClient } from "@/lib/twilio/client";
import { logAuditEvent } from "@/lib/audit/log";
import type { AuthActionState } from "@/lib/actions/auth";
import { normalizeAllowedOrigins } from "@/lib/widget/origins";

const connectSchema = z.object({
  organizationId: z.uuid(),
  accountSid: z.string().regex(/^AC[a-f0-9]{32}$/i, "Twilio Account SID 'AC' ile başlamalı (34 karakter)"),
  authToken: z.string().min(32, "Geçerli bir Twilio Auth Token gir"),
  whatsappFrom: z
    .string()
    .regex(/^whatsapp:\+[1-9]\d{6,14}$/, "Format: whatsapp:+14155238886 (ülke koduyla, boşluksuz)"),
});

/**
 * Bring-your-own Twilio: each organization connects its own Twilio
 * account + WhatsApp-approved number. Credentials are verified against
 * Twilio's API, then written to channel_secrets — a service-role-only
 * table (see 0016) — never to channel_connections.credentials, which
 * every org member (including viewers) can read.
 */
export async function connectTwilioAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = connectSchema.safeParse({
    organizationId: formData.get("organizationId"),
    accountSid: formData.get("accountSid"),
    authToken: formData.get("authToken"),
    whatsappFrom: formData.get("whatsappFrom"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { organizationId, accountSid, authToken, whatsappFrom } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // channel_secrets has no RLS policies for authenticated users, so the
  // admin client below bypasses RLS entirely for it — this role check is
  // the only thing standing between a non-admin org member and writing
  // another org's WhatsApp credentials.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "Only an owner or admin can connect WhatsApp." };
  }

  let status: "connected" | "error" = "connected";
  let lastError: string | null = null;
  try {
    const client = createTwilioClient(accountSid, authToken);
    await client.api.v2010.accounts(accountSid).fetch();
  } catch (err) {
    status = "error";
    lastError = err instanceof Error ? err.message : "Twilio kimlik bilgileri doğrulanamadı";
  }

  if (status === "error") {
    await logAuditEvent({
      organizationId,
      actorId: user.id,
      action: "connect_whatsapp_channel",
      targetType: "channel_connection",
      metadata: { status },
    });
    return { error: lastError ?? "Connection failed" };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("channel_connections")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("channel_type", "whatsapp")
    .maybeSingle();

  const fields = {
    channel_type: "whatsapp" as const,
    provider: "twilio" as const,
    external_id: whatsappFrom,
    display_name: `WhatsApp (${whatsappFrom.replace("whatsapp:", "")})`,
    status,
    last_event_at: new Date().toISOString(),
    last_error: null,
    created_by: user.id,
  };

  const { data: channelRow, error } = existing
    ? await admin.from("channel_connections").update(fields).eq("id", existing.id).select("id").single()
    : await admin
        .from("channel_connections")
        .insert({ ...fields, organization_id: organizationId })
        .select("id")
        .single();

  if (error || !channelRow) {
    // Unique constraint from 0014: this number is already the active
    // WhatsApp connection for a different organization.
    if (error?.code === "23505") {
      return { error: "This WhatsApp number is already connected to another mynode account." };
    }
    return { error: error?.message ?? "Could not save the connection" };
  }

  const { error: secretError } = await admin.from("channel_secrets").upsert(
    {
      channel_connection_id: channelRow.id,
      organization_id: organizationId,
      account_sid: accountSid,
      auth_token: authToken,
    },
    { onConflict: "channel_connection_id" },
  );
  if (secretError) return { error: secretError.message };

  await logAuditEvent({
    organizationId,
    actorId: user.id,
    action: "connect_whatsapp_channel",
    targetType: "channel_connection",
    targetId: channelRow.id,
    metadata: { status },
  });

  revalidatePath("/settings");
  return { success: true };
}

const disconnectSchema = z.object({ organizationId: z.uuid(), channelConnectionId: z.uuid() });

/** Owner/admin can disconnect a channel without needing DB access. */
export async function disconnectChannelAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = disconnectSchema.safeParse({
    organizationId: formData.get("organizationId"),
    channelConnectionId: formData.get("channelConnectionId"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("channel_connections")
    .update({ status: "disconnected", last_error: null })
    .eq("id", parsed.data.channelConnectionId)
    .eq("organization_id", parsed.data.organizationId);
  if (error) return { error: error.message };

  const admin = createAdminClient();
  await admin.from("channel_secrets").delete().eq("channel_connection_id", parsed.data.channelConnectionId);

  await logAuditEvent({
    organizationId: parsed.data.organizationId,
    actorId: user.id,
    action: "disconnect_channel",
    targetType: "channel_connection",
    targetId: parsed.data.channelConnectionId,
  });

  revalidatePath("/settings");
  return { success: true };
}

const webChannelSchema = z.object({
  organizationId: z.uuid(),
  welcomeMessage: z.string().max(240).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  allowedOrigins: z.string().min(1, "Enter at least one website URL"),
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
    allowedOrigins: formData.get("allowedOrigins"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let allowedOrigins: string[];
  try {
    allowedOrigins = normalizeAllowedOrigins(parsed.data.allowedOrigins);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Enter valid website URLs" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const credentials = {
    welcomeMessage: parsed.data.welcomeMessage ?? "Merhaba! Nasıl yardımcı olabiliriz?",
    color: parsed.data.color ?? "#4f46e5",
    allowedOrigins,
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

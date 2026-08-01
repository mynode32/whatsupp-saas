import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type ChannelConnection = Database["public"]["Tables"]["channel_connections"]["Row"];

/**
 * Resolves a public widget key to its channel_connections row, enforcing
 * the origin allowlist if one is configured (empty/unset = allow any
 * origin — permissive default for sites that haven't set one up).
 */
export async function resolveWidgetChannel(widgetKey: string, origin: string | null): Promise<ChannelConnection | null> {
  const admin = createAdminClient();
  const { data: channel } = await admin
    .from("channel_connections")
    .select("*")
    .eq("channel_type", "web")
    .eq("provider", "native")
    .eq("external_id", widgetKey)
    .eq("status", "connected")
    .maybeSingle();
  if (!channel) return null;

  const allowedOrigins = "allowedOrigins" in channel.credentials ? channel.credentials.allowedOrigins : undefined;
  if (allowedOrigins && allowedOrigins.length > 0) {
    if (!origin || !allowedOrigins.includes(origin)) return null;
  }
  return channel;
}

export function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

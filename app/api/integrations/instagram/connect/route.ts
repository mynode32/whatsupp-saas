import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";
import { publicEnv } from "@/lib/env";

/**
 * Starts the "Connect Instagram" flow: verifies the caller is an
 * owner/admin of the target org, then redirects to Meta's OAuth dialog.
 * A random nonce travels both as the `state` param and as an httpOnly
 * cookie so the callback can confirm this exact browser initiated the
 * request (standard OAuth CSRF protection) before trusting anything
 * Meta sends back.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  const settingsUrl = (query: string) => new URL(`/settings${query}`, publicEnv.NEXT_PUBLIC_APP_URL);
  if (!organizationId) return NextResponse.redirect(settingsUrl("?instagram_error=invalid_request"));

  if (!serverEnv.META_APP_ID || !serverEnv.META_APP_SECRET) {
    return NextResponse.redirect(settingsUrl("?instagram_error=not_configured"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", publicEnv.NEXT_PUBLIC_APP_URL));

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return NextResponse.redirect(settingsUrl("?instagram_error=forbidden"));
  }

  const nonce = crypto.randomUUID();
  const state = `${nonce}.${organizationId}`;
  const redirectUri = `${publicEnv.NEXT_PUBLIC_APP_URL}/api/integrations/instagram/callback`;

  const authorizeUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authorizeUrl.searchParams.set("client_id", serverEnv.META_APP_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("ig_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";
import { publicEnv } from "@/lib/env";
import { exchangeCodeForUserToken, exchangeForLongLivedToken, fetchInstagramCandidates } from "@/lib/meta/graph";
import { connectInstagramCandidate } from "@/lib/meta/connect";

/**
 * Meta redirects here after the user approves (or denies) the OAuth
 * dialog. One Page with a linked Instagram Business account connects
 * immediately; multiple Pages fall through to a picker (the page access
 * tokens travel in an httpOnly cookie, never the URL or the client).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const settingsUrl = (query: string) => new URL(`/settings${query}`, publicEnv.NEXT_PUBLIC_APP_URL);

  if (oauthError) return NextResponse.redirect(settingsUrl("?instagram_error=denied"));
  if (!code || !state) return NextResponse.redirect(settingsUrl("?instagram_error=invalid_request"));

  const [nonce, organizationId] = state.split(".");
  const cookieStore = await cookies();
  const storedNonce = cookieStore.get("ig_oauth_nonce")?.value;
  if (!storedNonce || storedNonce !== nonce || !organizationId) {
    return NextResponse.redirect(settingsUrl("?instagram_error=invalid_request"));
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
  if (!serverEnv.META_APP_ID || !serverEnv.META_APP_SECRET) {
    return NextResponse.redirect(settingsUrl("?instagram_error=not_configured"));
  }

  try {
    const redirectUri = `${publicEnv.NEXT_PUBLIC_APP_URL}/api/integrations/instagram/callback`;
    const shortLivedToken = await exchangeCodeForUserToken(code, redirectUri, serverEnv.META_APP_ID, serverEnv.META_APP_SECRET);
    const longLivedToken = await exchangeForLongLivedToken(shortLivedToken, serverEnv.META_APP_ID, serverEnv.META_APP_SECRET);
    const candidates = await fetchInstagramCandidates(longLivedToken);

    if (candidates.length === 0) {
      const response = NextResponse.redirect(settingsUrl("?instagram_error=no_pages"));
      response.cookies.delete("ig_oauth_nonce");
      return response;
    }

    if (candidates.length === 1) {
      await connectInstagramCandidate(organizationId, user.id, candidates[0]);
      const response = NextResponse.redirect(settingsUrl("?instagram=connected"));
      response.cookies.delete("ig_oauth_nonce");
      return response;
    }

    const response = NextResponse.redirect(
      new URL(`/settings/instagram-pages?organizationId=${organizationId}`, publicEnv.NEXT_PUBLIC_APP_URL),
    );
    response.cookies.set("ig_oauth_candidates", Buffer.from(JSON.stringify(candidates)).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    response.cookies.delete("ig_oauth_nonce");
    return response;
  } catch (err) {
    console.error("Instagram OAuth callback failed", err);
    const response = NextResponse.redirect(settingsUrl("?instagram_error=exchange_failed"));
    response.cookies.delete("ig_oauth_nonce");
    return response;
  }
}

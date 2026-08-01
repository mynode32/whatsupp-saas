import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

const APP_ROUTES = ["/dashboard", "/conversations", "/automations", "/knowledge", "/settings"];

/**
 * Refreshes the Supabase auth cookie on every request and enforces:
 * unauthenticated -> app routes redirect to /login; authenticated with
 * no organization yet -> redirect to /onboarding; authenticated ->
 * /login or /signup redirects to /dashboard.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Supabase not configured yet — nothing to enforce (demo mode).
    return response;
  }

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAppRoute = APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isOnboarding = pathname === "/onboarding";

  if (!user && (isAppRoute || isOnboarding)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (isAppRoute || isOnboarding)) {
    const { count } = await supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    const hasOrg = (count ?? 0) > 0;

    if (!hasOrg && isAppRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
    if (hasOrg && isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

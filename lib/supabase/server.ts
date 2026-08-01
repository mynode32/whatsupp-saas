import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Server Supabase client for Server Components / Server Actions —
 * respects RLS via the signed-in user's session (read from cookies).
 * Cookie writes are swallowed when called from a Server Component
 * (Next.js forbids it there); Faz 2's auth middleware refreshes the
 * session cookie on every request instead.
 */
export async function createClient() {
  // cookies() MUST be called before the config check below (even
  // though its result isn't needed yet if we're about to throw) —
  // it's how Next.js detects a route needs dynamic rendering. Throwing
  // first meant the build's static-generation trial-render crashed
  // instead of Next just deferring the page to request time.
  const cookieStore = await cookies();

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — no-op, middleware handles refresh.
          }
        },
      },
    },
  );
}

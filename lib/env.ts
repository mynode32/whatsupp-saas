import { z } from "zod";

/**
 * Public environment variables — safe to ship to the browser.
 * Next.js only inlines vars whose literal `process.env.NEXT_PUBLIC_*`
 * access it can statically see, so each key is read explicitly below.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

/** Empty-string env vars (e.g. `KEY=` left blank by setup) count as unset, not invalid. */
function emptyToUndefined(v: string | undefined) {
  return v === "" ? undefined : v;
}

function parsePublicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_APP_URL: emptyToUndefined(process.env.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_SUPABASE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid public environment variables:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`,
    );
  }
  return parsed.data;
}

export const publicEnv = parsePublicEnv();

/** True once both public Supabase vars are present — full check (incl. service role) lives in env.server.ts. */
export const hasPublicSupabaseConfig = Boolean(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

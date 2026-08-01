import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * Uses a shared Postgres bucket in configured environments so limits survive
 * cold starts and work across serverless instances. The in-memory limiter is
 * retained only as a zero-config development fallback.
 */
export async function isRateLimitedShared(
  key: string,
  maxRequests = 20,
  windowMs = 60_000,
): Promise<boolean> {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return isRateLimited(key, maxRequests, windowMs);
  }

  const bucketKey = createHash("sha256").update(key).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_rate_limit", {
    input_key: bucketKey,
    max_requests: maxRequests,
    window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
  });
  // Keep existing deployments usable during the short migration rollout
  // window; once 0014 is applied all production requests use the shared DB.
  if (error?.code === "PGRST202" || error?.code === "42P01" || error?.code === "42883") {
    return isRateLimited(key, maxRequests, windowMs);
  }
  if (error) throw new Error(`Rate limiter unavailable: ${error.message}`);
  return Boolean(data);
}

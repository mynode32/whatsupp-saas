import "server-only";

const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

/**
 * In-memory sliding-window limiter, keyed by widgetKey+visitorId or IP.
 * Per Node process only — fine for a single-instance deployment, but a
 * real multi-instance deploy needs a shared store (Redis/Upstash). No
 * CAPTCHA integration (would need another external provider/key) —
 * this rate limit is the spam defense for now.
 */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count++;
  return bucket.count > MAX_REQUESTS;
}

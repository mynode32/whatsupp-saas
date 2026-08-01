// No "server-only" guard: this holds no secrets, just an in-memory
// counter, and it needs to be importable from a plain test runner.
const buckets = new Map<string, { count: number; resetAt: number }>();
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;

/**
 * In-memory sliding-window limiter, keyed however the caller likes
 * (IP, user id, widgetKey+visitorId, ...). Per Node process only —
 * fine for a single-instance deployment, but a real multi-instance
 * deploy needs a shared store (Redis/Upstash). No CAPTCHA integration
 * (would need another external provider/key) — rate limiting is the
 * spam/abuse defense for now.
 */
export function isRateLimited(key: string, maxRequests = DEFAULT_MAX_REQUESTS, windowMs = DEFAULT_WINDOW_MS): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count++;
  return bucket.count > maxRequests;
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 12;
const MAX_BUCKETS = 10000;

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory fixed-window rate limiter. Per-serverless-instance, so it is not a
// global hard cap across many instances, but it blocks the common abuse
// patterns (hammering an endpoint to rack up paid AI Gateway calls).
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
): { ok: true; remaining: number } | { ok: false; retryAfter: number } {
  const now = Date.now();
  if (buckets.size >= MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1 };
  }
  if (bucket.count >= MAX_REQUESTS) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true, remaining: MAX_REQUESTS - bucket.count };
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
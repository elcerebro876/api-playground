import { getSupabase } from "@/lib/supabase";

// Server-side AI-cost backstop, keyed by client IP. Uses a shared Postgres
// counter (via the existing Supabase client) so the limit actually holds
// across serverless instances. Falls back to a best-effort in-memory bucket
// when the database is unreachable (pre-migration, DB down), keeping the app
// working while weakening the guarantee rather than breaking requests.

const BURST_MAX = 12;
const BURST_WINDOW_SECS = 10 * 60;
const DAILY_MAX = 30;
const MAX_BUCKETS = 10000;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function memoryRateLimit(
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
    buckets.set(key, { count: 1, resetAt: now + BURST_WINDOW_SECS * 1000 });
    return { ok: true, remaining: BURST_MAX - 1 };
  }
  if (bucket.count >= BURST_MAX) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true, remaining: BURST_MAX - bucket.count };
}

type RpcResult = {
  ok: boolean;
  remaining: number;
  retry_after: number;
};

async function sharedRateLimit(key: string): Promise<RpcResult | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.rpc("bump_rate_limit", {
      k: key,
      burst_max: BURST_MAX,
      burst_window_secs: BURST_WINDOW_SECS,
      daily_max: DAILY_MAX,
    });
    if (error) throw error;
    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as RpcResult).ok !== "boolean"
    ) {
      throw new Error("unexpected bump_rate_limit payload");
    }
    return data as RpcResult;
  } catch {
    // Shared limiter unavailable (migration not applied, DB down): report null
    // so the caller falls back to the in-memory bucket.
    return null;
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfter: number };

export async function rateLimit(key: string): Promise<RateLimitResult> {
  const shared = await sharedRateLimit(key);
  if (shared) {
    return shared.ok
      ? { ok: true, remaining: Number(shared.remaining ?? 0) }
      : { ok: false, retryAfter: Number(shared.retry_after ?? 1) };
  }
  return memoryRateLimit(key);
}

export function clientIp(request: Request): string {
  // Only trust the first x-forwarded-for hop when running behind the Vercel
  // platform, which sets and overwrites the header server-side. On any other
  // deployment a client-supplied x-forwarded-for is spoofable, so prefer
  // x-real-ip (set by the trusted reverse proxy) instead.
  if (process.env.VERCEL) {
    const fwd = request.headers.get("x-forwarded-for");
    const first = fwd?.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
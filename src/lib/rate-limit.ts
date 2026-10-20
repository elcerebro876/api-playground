import { getSupabase } from "@/lib/supabase";

const BURST_MAX = 12;
const BURST_WINDOW_SECS = 10 * 60;
const DAILY_MAX_PER_IP = 30;

const DIAGNOSE_DAILY_MAX_DEFAULT = 300;

// Global daily ceiling across ALL clients, so total model spend is bounded even
// when many distinct IPs appear. The value is derived in code (never baked into
// SQL): DIAGNOSE_GLOBAL_DAILY_MAX wins when set, otherwise ten times the per-IP
// daily allowance, i.e. an expected concurrent client-IP budget.
const GLOBAL_DAILY_IP_BUDGET = 10;

export function globalDailyMax(): number {
  const override = Number(process.env.DIAGNOSE_GLOBAL_DAILY_MAX);
  if (Number.isFinite(override) && override > 0) return Math.floor(override);
  return DAILY_MAX_PER_IP * GLOBAL_DAILY_IP_BUDGET;
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfter: number }
  | { ok: false; unavailable: true };

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(input));
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type RpcResult = {
  ok: boolean;
  remaining: number;
  retry_after: number;
};

export type RateLimitOptions = {
  burstMax?: number;
  burstWindowSecs?: number;
  dailyMax?: number;
};

async function bumpShared(
  key: string,
  opts?: RateLimitOptions,
): Promise<RpcResult | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.rpc("bump_rate_limit", {
      k: key,
      burst_max: opts?.burstMax ?? BURST_MAX,
      burst_window_secs: opts?.burstWindowSecs ?? BURST_WINDOW_SECS,
      daily_max: opts?.dailyMax ?? DAILY_MAX_PER_IP,
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
    return null;
  }
}

export async function rateLimit(
  key: string,
  opts?: RateLimitOptions,
): Promise<RateLimitResult> {
  const shared = await bumpShared(key, opts);
  if (shared) {
    return shared.ok
      ? { ok: true, remaining: Number(shared.remaining ?? 0) }
      : { ok: false, retryAfter: Number(shared.retry_after ?? 1) };
  }
  return { ok: false, unavailable: true };
}

export async function consumeGlobalDaily(namespace: string, maxCount?: number): Promise<RateLimitResult> {
  const client = getSupabase();
  const max = Math.max(1, Number(maxCount ?? DIAGNOSE_DAILY_MAX_DEFAULT));
  if (!client) return { ok: false, unavailable: true };
  const k = `${namespace}:daily`;
  try {
    const { data, error } = await client.rpc("consume_global_daily", {
      k,
      max_count: max,
    });
    if (error) throw error;
    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as RpcResult).ok !== "boolean"
    ) {
      throw new Error("unexpected consume_global_daily payload");
    }
    const d = data as RpcResult;
    return d.ok
      ? { ok: true, remaining: Number(d.remaining ?? 0) }
      : { ok: false, retryAfter: Number(d.retry_after ?? 1) };
  } catch {
    return { ok: false, unavailable: true };
  }
}

export function clientIp(request: Request): string {
  // Only trust forwarding headers when running behind Vercel's edge, which
  // sets and owns them. Off-Vercel there is no trusted proxy, so a
  // client-supplied x-real-ip would let anyone pick their own rate-limit
  // bucket — fall back to a single shared bucket instead.
  if (process.env.VERCEL) {
    const fwd = request.headers.get("x-forwarded-for");
    const first = fwd?.split(",")[0]?.trim();
    if (first) return first;
    const real = request.headers.get("x-real-ip")?.trim();
    if (real) return real;
  }
  return "unknown";
}

export async function hashKey(namespace: string, ip: string): Promise<string> {
  const h = await sha256Hex(`${namespace}:${ip}`);
  return `${namespace}:${h}`;
}

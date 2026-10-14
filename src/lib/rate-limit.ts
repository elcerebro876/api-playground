import { getSupabase } from "@/lib/supabase";

const BURST_MAX = 12;
const BURST_WINDOW_SECS = 10 * 60;
const DAILY_MAX_PER_IP = 30;

const DIAGNOSE_DAILY_MAX_DEFAULT = 300;

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

async function bumpShared(key: string): Promise<RpcResult | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.rpc("bump_rate_limit", {
      k: key,
      burst_max: BURST_MAX,
      burst_window_secs: BURST_WINDOW_SECS,
      daily_max: DAILY_MAX_PER_IP,
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

export async function rateLimit(key: string): Promise<RateLimitResult> {
  const shared = await bumpShared(key);
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
  if (process.env.VERCEL) {
    const fwd = request.headers.get("x-forwarded-for");
    const first = fwd?.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function hashKey(namespace: string, ip: string): Promise<string> {
  const h = await sha256Hex(`${namespace}:${ip}`);
  return `${namespace}:${h}`;
}

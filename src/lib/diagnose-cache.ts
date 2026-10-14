import { getSupabase } from "@/lib/supabase";

export interface CacheEntry {
  key: string;
  result: unknown;
  identifiable: boolean;
  expiresAt: number;
}

const MAX_ENTRIES = 200;
const lru = new Map<string, CacheEntry>();

export function cacheGet(key: string): CacheEntry | null {
  const hit = lru.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    lru.delete(key);
    lru.set(key, hit);
    return hit;
  }
  if (hit) lru.delete(key);
  return null;
}

export async function cacheGetFromStore(key: string): Promise<CacheEntry | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("diagnosis_cache")
      .select("key,result,identifiable,expires_at")
      .eq("key", key)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const entry: CacheEntry = {
      key: data.key,
      result: data.result,
      identifiable: !!data.identifiable,
      expiresAt: new Date(data.expires_at).getTime(),
    };
    return entry;
  } catch {
    return null;
  }
}

export async function cachePut(key: string, result: unknown, identifiable: boolean, ttlSecs: number): Promise<void> {
  const expiresAt = Date.now() + ttlSecs * 1000;
  const entry: CacheEntry = { key, result, identifiable, expiresAt };
  lru.set(key, entry);
  if (lru.size > MAX_ENTRIES) {
    const first = lru.keys().next().value;
    if (first) lru.delete(first);
  }

  const client = getSupabase();
  if (!client) return;
  try {
    await client
      .from("diagnosis_cache")
      .upsert(
        {
          key,
          result,
          identifiable,
          expires_at: new Date(expiresAt).toISOString(),
        },
        { onConflict: "key" }
      );
    if (Math.random() < 0.01) {
      try {
        await client.rpc("cache_cleanup");
      } catch {}
    }
  } catch {
    // tolerate L2 failures
  }
}

import { getSupabase } from "@/lib/supabase";
import type { ExplainSections } from "@/lib/explain";

export type CachedExplain = {
  sections: ExplainSections;
  createdAt: string;
  expiresAt: string;
};

function sectionsFrom(value: unknown): ExplainSections | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.who !== "string" ||
    typeof v.what !== "string" ||
    typeof v.build !== "string"
  ) {
    return null;
  }
  return { who: v.who, what: v.what, build: v.build };
}

export async function explainCacheGet(
  key: string,
): Promise<CachedExplain | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("explain_cache")
      .select("result,created_at,expires_at,call_count")
      .eq("key", key)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const sections = sectionsFrom(data.result);
    if (!sections) return null;
    await client
      .from("explain_cache")
      .update({ call_count: (data.call_count ?? 0) + 1 })
      .eq("key", key);
    return {
      sections,
      createdAt: new Date(data.created_at).toISOString(),
      expiresAt: new Date(data.expires_at).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function explainCachePut(
  key: string,
  sections: ExplainSections,
  ttlSecs: number,
): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const now = Date.now();
  try {
    await client.from("explain_cache").upsert(
      {
        key,
        result: sections,
        created_at: new Date(now).toISOString(),
        expires_at: new Date(now + ttlSecs * 1000).toISOString(),
      },
      { onConflict: "key" },
    );
  } catch {
    // Caching is best-effort; the explanation is still returned.
  }
}

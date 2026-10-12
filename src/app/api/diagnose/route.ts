import {
  buildDiagnosisInput,
  diagnosisCacheKey,
  generateDiagnosis,
  type DiagnosisResult,
} from "@/lib/diagnose";
import { isAIConfigured } from "@/lib/ai";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// In-memory diagnosis cache. Per-instance and cleared on cold start/deploy,
// which is fine: it exists to make a user's repeat of the SAME failing request
// resolve instantly (and skip the AI call) instead of re-running the chain.
const CACHE_TTL_MS = 10 * 60 * 1000;
// A genuine "nothing found" is cheap to redo, but a user often retries the same
// ambiguous failure; cache it briefly so the repeats are instant. Provider
// failures never reach here (they throw and return a 500), so they are never
// cached.
const NON_IDENTIFIABLE_CACHE_TTL_MS = 2 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

type CacheEntry = { value: DiagnosisResult; expires: number };
const diagnosisCache = new Map<string, CacheEntry>();

function cacheGet(key: string): DiagnosisResult | null {
  const entry = diagnosisCache.get(key);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    diagnosisCache.delete(key);
    return null;
  }
  // Refresh recency (Map preserves insertion order for LRU eviction).
  diagnosisCache.delete(key);
  diagnosisCache.set(key, entry);
  return entry.value;
}

function cacheSet(key: string, value: DiagnosisResult, ttlMs: number): void {
  diagnosisCache.delete(key);
  diagnosisCache.set(key, { value, expires: Date.now() + ttlMs });
  while (diagnosisCache.size > CACHE_MAX_ENTRIES) {
    const oldest = diagnosisCache.keys().next().value;
    if (oldest === undefined) break;
    diagnosisCache.delete(oldest);
  }
}

export async function GET() {
  return Response.json({ configured: isAIConfigured() });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = await rateLimit(`diagnose:${ip}`);
  if (!rl.ok) {
    return Response.json(
      { error: "Too many requests, try again later" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let payload: {
    method?: string;
    url?: string;
    requestHeaders?: Record<string, string>;
    status?: number | null;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Defense in depth: re-mask on the server even though the client already masks.
  const input = buildDiagnosisInput(payload);
  if (!input.url) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  if (!isAIConfigured()) {
    return Response.json(
      {
        error:
          "AI diagnosis is not configured yet. Add CEREBRAS_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY to enable it.",
      },
      { status: 503 },
    );
  }

  const cacheKey = diagnosisCacheKey(input);
  const cached = cacheGet(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  try {
    const result = await generateDiagnosis(input);
    cacheSet(
      cacheKey,
      result,
      result.identifiable ? CACHE_TTL_MS : NON_IDENTIFIABLE_CACHE_TTL_MS,
    );
    return Response.json(result);
  } catch (e) {
    console.error("[diagnose] failed", (e as Error)?.message);
    return Response.json(
      { error: "Couldn't diagnose this request, try again" },
      { status: 500 },
    );
  }
}
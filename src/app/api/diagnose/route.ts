import {
  buildDiagnosisInput,
  diagnosisCacheKey,
  generateDiagnosis,
} from "@/lib/diagnose";
import { isAIConfigured } from "@/lib/ai";
import { clientIp, hashKey, rateLimit } from "@/lib/rate-limit";
import { cacheGet, cacheGetFromStore, cachePut } from "@/lib/diagnose-cache";

// TTLs for the shared diagnosis cache (L1 in-process + L2 Supabase). A genuine
// "nothing found" is cheap to redo, but a user often retries the same ambiguous
// failure, so it is cached briefly. Provider failures throw before caching.
const CACHE_TTL_SECS = 10 * 60;
const NON_IDENTIFIABLE_CACHE_TTL_SECS = 2 * 60;

export async function GET() {
  return Response.json({ configured: isAIConfigured() });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = await rateLimit(await hashKey("diagnose", ip));
  if (!rl.ok) {
    if ("retryAfter" in rl) {
      return Response.json(
        { error: "Too many requests, try again later" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }
    return Response.json(
      { error: "Diagnosis is temporarily unavailable. Please try again later." },
      { status: 503 },
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
  const cached = cacheGet(cacheKey) ?? (await cacheGetFromStore(cacheKey));
  if (cached) {
    return Response.json(cached.result);
  }

  try {
    const result = await generateDiagnosis(input);
    await cachePut(
      cacheKey,
      result,
      result.identifiable,
      result.identifiable ? CACHE_TTL_SECS : NON_IDENTIFIABLE_CACHE_TTL_SECS,
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

import { isAIConfigured } from "@/lib/ai";
import {
  EXPLAIN_TTL_SECS,
  generateExplainSections,
  type ExplainModelInput,
  type ExplainResult,
  type ExplainSections,
} from "@/lib/explain";
import { EXPLAIN_INPUT_LIMIT, isExplainEligible } from "@/lib/explain-eligibility";
import {
  contentTypeFamily,
  explainCacheKey,
  structureSignature,
} from "@/lib/explain-key";
import {
  explainCacheGet,
  explainCachePut,
  type CachedExplain,
} from "@/lib/explain-cache";
import { clientIp, hashKey, rateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/error-reporter";
import { maskErrorForReport, maskUrlSecrets } from "@/lib/diagnose";

type ExplainPayloadInput = {
  method?: unknown;
  url?: unknown;
  apiName?: unknown;
  status?: unknown;
  body?: unknown;
  contentType?: unknown;
  truncated?: unknown;
  credentialed?: unknown;
};

export type ExplainRouteDeps = {
  burstLimit?: (request: Request) => Promise<RateLimitResult>;
  cacheGet?: (key: string) => Promise<CachedExplain | null>;
  cachePut?: (
    key: string,
    sections: ExplainSections,
    ttlSecs: number,
  ) => Promise<void>;
  generate?: (input: ExplainModelInput) => Promise<ExplainSections>;
  aiConfigured?: () => boolean;
  now?: () => number;
};

function defaultBurstLimit(request: Request): Promise<RateLimitResult> {
  return hashKey("explain", clientIp(request)).then((key) => rateLimit(key));
}

function collectLeakValues(value: unknown, out: Set<string>): void {
  if (out.size >= 500) return;
  if (Array.isArray(value)) {
    for (const item of value) collectLeakValues(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectLeakValues(item, out);
    }
    return;
  }
  if (typeof value === "string") {
    const text = value.trim();
    if (text.length >= 6) out.add(text);
    return;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const text = String(Math.abs(value));
    if (text.length >= 4) out.add(text);
  }
}

// A cached explanation is shared across users, so it must never repeat a value
// from the response. Strings of 6+ chars and numbers of 4+ digits count.
export function sectionsLeakValues(
  sections: ExplainSections,
  body: string,
): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return false;
  }
  const values = new Set<string>();
  collectLeakValues(parsed, values);
  if (values.size === 0) return false;
  const haystack = `${sections.who}\n${sections.what}\n${sections.build}`.toLowerCase();
  for (const value of values) {
    if (haystack.includes(value.toLowerCase())) return true;
  }
  return false;
}

export async function handleExplain(
  request: Request,
  deps: ExplainRouteDeps = {},
): Promise<Response> {
  const now = deps.now ?? Date.now;
  const aiConfigured = deps.aiConfigured ?? isAIConfigured;
  const generate = deps.generate ?? generateExplainSections;
  const cacheGet = deps.cacheGet ?? explainCacheGet;
  const cachePut = deps.cachePut ?? explainCachePut;

  const burst = await (deps.burstLimit ?? defaultBurstLimit)(request);
  if (!burst.ok) {
    if ("retryAfter" in burst) {
      return Response.json(
        { error: "Too many requests, try again later" },
        { status: 429, headers: { "Retry-After": String(burst.retryAfter) } },
      );
    }
    return Response.json(
      { error: "Explanations aren't available right now." },
      { status: 503 },
    );
  }

  let payload: ExplainPayloadInput;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawUrl = typeof payload.url === "string" ? payload.url.trim() : "";
  const endpointUrl = rawUrl.slice(0, 500);
  const apiName =
    typeof payload.apiName === "string" && payload.apiName.trim()
      ? payload.apiName.trim().slice(0, 100)
      : "API";
  const status = Number(payload.status);
  const body = (typeof payload.body === "string" ? payload.body : "").slice(
    0,
    EXPLAIN_INPUT_LIMIT,
  );
  const truncated = payload.truncated === true;
  const credentialed = payload.credentialed === true;
  const method = (
    typeof payload.method === "string" && payload.method.trim()
      ? payload.method.trim()
      : "GET"
  ).toUpperCase();
  const contentType = (
    typeof payload.contentType === "string" ? payload.contentType : ""
  ).trim();

  if (!endpointUrl) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }
  if (!/^[A-Z]+$/.test(method)) {
    return Response.json({ error: "Invalid method" }, { status: 400 });
  }
  if (!Number.isFinite(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const eligibility = isExplainEligible({
    status,
    body,
    headers: {
      "content-type": contentType || "application/json",
    },
    truncated,
  });
  if (!eligibility.ok) {
    return Response.json(
      { error: "This response can't be explained." },
      { status: 400 },
    );
  }

  const effectiveContentType = contentType || "application/json";
  const cacheKey = explainCacheKey({
    method,
    url: endpointUrl,
    status,
    contentType: effectiveContentType,
    body,
    credentialed,
  });

  if (cacheKey) {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      const remaining = Math.floor(
        (Date.parse(cached.expiresAt) - now()) / 1000,
      );
      if (remaining > 0) {
        const result: ExplainResult = {
          ...cached.sections,
          fromCache: true,
          createdAt: cached.createdAt,
          ttlSecs: remaining,
          truncated,
        };
        return Response.json(result);
      }
    }
  }

  if (!aiConfigured()) {
    return Response.json(
      { error: "Explanations aren't available right now." },
      { status: 503 },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    return Response.json(
      { error: "This response can't be explained." },
      { status: 400 },
    );
  }

  let sections: ExplainSections;
  try {
    sections = await generate({
      apiName,
      method,
      endpointUrl: maskUrlSecrets(endpointUrl),
      status,
      contentType: contentTypeFamily(effectiveContentType),
      structure: structureSignature(parsedBody),
      truncated,
    });
  } catch (e) {
    const safe = maskErrorForReport(e);
    await captureServerError(safe, { route: "explain", phase: "generate" });
    return Response.json(
      { error: "Couldn't explain this response, try again" },
      { status: 500 },
    );
  }

  const result: ExplainResult = {
    who: sections.who,
    what: sections.what,
    build: sections.build,
    fromCache: false,
    createdAt: new Date(now()).toISOString(),
    ttlSecs: EXPLAIN_TTL_SECS,
    truncated,
  };

  if (cacheKey && !sectionsLeakValues(sections, body)) {
    await cachePut(cacheKey, sections, EXPLAIN_TTL_SECS);
  }

  return Response.json(result);
}

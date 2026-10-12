import { callAIJson } from "@/lib/ai";
import { authHintForUrl, type AuthHint } from "@/lib/api-auth";
import { isAllowedMethod } from "@/lib/http-methods";

export const DIAGNOSIS_MAX_USES = 5;

export type DiagnosisConfidence = "high" | "medium" | "low";

export type DiagnosisFix = {
  from: string;
  to: string;
  stripScheme: boolean;
};

export type DiagnosisValueFix = {
  key: string;
  stripScheme: boolean;
};

export type DiagnosisResult = {
  identifiable: boolean;
  title?: string;
  message?: string;
  // Short quote from the response that justifies the diagnosis, if provided.
  evidence?: string;
  confidence?: DiagnosisConfidence;
  headerFix?: DiagnosisFix | null;
  valueFix?: DiagnosisValueFix | null;
  methodFix?: string | null;
};

const SCHEME_RE = /^(Bearer|Basic|Token|ApiKey|API[-_ ]?Key|Digest)\s+/i;

export function maskHeaderValue(value: string): string {
  const head = (value ?? "").trim();
  if (!head) return (value ?? "").trim();
  const m = head.match(SCHEME_RE);
  if (m) return `${m[0].trim()} ****`;
  return "****";
}

const SECRET_HEADER_RE =
  /authorization|cookie|x-(api[-_ ]?key|auth|token|key)|api[-_ ]?key|token|secret|session/i;

export function maskHeaders(
  headers: Record<string, string> | undefined | null,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  for (const [k, v] of Object.entries(headers)) {
    const lk = k.toLowerCase();
    out[k] = SECRET_HEADER_RE.test(lk) ? maskHeaderValue(v) : v;
  }
  return out;
}

const SECRET_QUERY_RE =
  /key|api[-_]?key|token|secret|password|passwd|auth|signature|client[_\-]?secret|appid/i;

export function maskUrlSecrets(url: string): string {
  try {
    const u = new URL(url);
    const q = new URLSearchParams(u.search);
    let changed = false;
    for (const [k, v] of q.entries()) {
      if (SECRET_QUERY_RE.test(k) && v) {
        q.set(k, "****");
        changed = true;
      }
    }
    if (changed) u.search = q.toString();
    return u.toString();
  } catch {
    return url;
  }
}

const SECRET_KEY_IN_TEXT_RE =
  /("(?:api[-_]?key|token|secret|authorization|password|client[-_]?secret|appid|sig)"\s*[:=]\s*)"[^"]*"/gi;

export function maskSensitiveStrings(text: string): string {
  if (!text) return text;
  return text.replace(SECRET_KEY_IN_TEXT_RE, '$1"****"');
}

export type DiagnosisInput = {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  status: number | null;
  responseHeaders?: Record<string, string> | null;
  responseBody?: string;
};

// Raw (possibly secret-bearing) request shape accepted from the client. It is
// masked into a DiagnosisInput before anything is sent to the model.
export type DiagnosisInputRaw = {
  method?: string;
  url?: string;
  requestHeaders?: Record<string, string> | null;
  status?: number | null;
  responseHeaders?: Record<string, string> | null;
  responseBody?: string;
};

// Cap on the response body fed to the model. Latency scales with input tokens,
// and the diagnosis only needs the leading error payload.
export const DIAGNOSIS_BODY_LIMIT = 2000;

// Single source of truth for masking. Both the browser (to build the request it
// sends and its cache key) and the API route (defense in depth) call this, so
// the two sides always compute an identical DiagnosisInput - and therefore an
// identical cache key.
export function buildDiagnosisInput(raw: DiagnosisInputRaw): DiagnosisInput {
  const method = (raw.method ?? "GET").trim().toUpperCase().slice(0, 10);
  const url = (raw.url ?? "").trim().slice(0, 500);
  return {
    method,
    url: maskUrlSecrets(url),
    requestHeaders: maskHeaders(raw.requestHeaders ?? {}),
    status: typeof raw.status === "number" ? raw.status : null,
    responseHeaders: maskHeaders(raw.responseHeaders ?? {}),
    responseBody: maskSensitiveStrings(
      (raw.responseBody ?? "").slice(0, DIAGNOSIS_BODY_LIMIT),
    ),
  };
}

// cyrb53-style non-cryptographic hash: deterministic and safe to run in both
// the browser and Node (no crypto dependency).
function hashString(str: string): string {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
}

// Stable key for an identical failure. Header keys are lowercased and sorted so
// ordering/casing never splits the cache; values are already masked, so two
// different secrets for the same shape share one entry (the fix references the
// header name, and the concrete expected value is derived client-side).
export function diagnosisCacheKey(input: DiagnosisInput): string {
  const headers = Object.entries(input.requestHeaders)
    .map(([k, v]) => `${k.toLowerCase()}:${v}`)
    .sort();
  const respHeaders = Object.entries(input.responseHeaders ?? {})
    .map(([k, v]) => `${k.toLowerCase()}:${v}`)
    .sort();
  return hashString(
    [
      input.method,
      input.url,
      String(input.status ?? ""),
      headers.join("|"),
      respHeaders.join("|"),
      input.responseBody ?? "",
    ].join("\n"),
  );
}

export async function generateDiagnosis(
  input: DiagnosisInput,
): Promise<DiagnosisResult> {
  const headerLines =
    Object.entries(input.requestHeaders).length > 0
      ? Object.entries(input.requestHeaders)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")
      : "(no request headers)";

  const responseHeaderLines =
    input.responseHeaders && Object.entries(input.responseHeaders).length > 0
      ? Object.entries(input.responseHeaders)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")
      : "(none)";

  const hint = authHintForUrl(input.url);

  const prompt = [
    "You diagnose why a single HTTP request failed, so the user can fix it.",
    "",
    "REQUEST:",
    `Method: ${input.method}`,
    `URL: ${input.url}`,
    "Request headers (sensitive values are REDACTED as **** for privacy - judge by key names, whether they are present, and the auth scheme only):",
    headerLines,
    "",
    "RESPONSE:",
    `Status: ${input.status ?? "(network error, no HTTP response received)"}`,
    "Response headers:",
    responseHeaderLines,
    "Response body:",
    input.responseBody || "(empty body)",
    ...(hint
      ? [
          "",
          "KNOWN AUTH CONVENTION FOR THIS HOST (authoritative - prefer this over generic assumptions):",
          hint.note,
        ]
      : []),
    "",
    "HOW TO DECIDE:",
    "1. Read the status and response body, and quote the vendor's own words as evidence.",
    "2. Decide whether this is a REQUEST-side fault that is concrete and grounded in the request above.",
    "3. Classify the request-side fault: wrong auth scheme, wrong header name, wrong header value, key belongs somewhere else (e.g. a query parameter), a required header is missing, wrong content type, or wrong path/method.",
    "",
    "OUTPUT RULES:",
    'Return STRICT JSON: {"identifiable": <bool>, "title": "<max 6 words>", "message": "<one sentence, under ~28 words, naming the exact field and the fix>", "evidence": "<short quote from the response that justifies this>", "confidence": "high"|"medium"|"low", "headerFix": {"from": "<WrongHeader>", "to": "<CorrectHeader>", "stripScheme": <bool>} | null, "valueFix": {"key": "<HeaderName>", "stripScheme": <bool>} | null, "methodFix": "<METHOD>" | null}.',
    "When identifiable is false, return exactly {\"identifiable\": false} with no other fields.",
    "headerFix: set ONLY when the same secret the user already sent must move VERBATIM to a DIFFERENT header. `from` and `to` must differ (case-insensitive). Set stripScheme true when the value must drop a leading scheme word such as \"Bearer \" or \"Basic \".",
    'valueFix: set ONLY when the header name is already correct for this API, the user DID send it, and the secret VALUE inside it is wrong/expired. key must be one of the auth headers actually present in the request. Set stripScheme true when the current value carries a leading scheme word.',
    'methodFix: set ONLY when the request used the wrong HTTP method (status 405, or otherwise evident) AND the correct method is evidenced by the response (an `Allow` response header or the response text naming a method). Value must be exactly one of GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS and must differ from the request method. Never guess a target method without evidence.',
    "Emit at most one of headerFix/valueFix/methodFix. If the fix is neither a header rename, a header-value replacement, nor a method switch (for example the key belongs in a query parameter, a header is missing entirely, or the fault is elsewhere), set all of them to null and state the exact fix in `message`.",
    "Use confidence \"high\" only when the response evidence clearly supports the fault; use \"low\" when you are unsure.",
    "GROUNDING: only state what a host requires when a KNOWN AUTH CONVENTION is given above. If no convention is given, do not assert what the API expects (for example, never claim an endpoint does not require authentication, nor that it uses a particular scheme or parameter); diagnose strictly from the status and response evidence, and if the fault would depend on knowing the host's convention, use confidence \"low\".",
    "When no KNOWN AUTH CONVENTION is given, never name a specific scheme or header in `message` (do not write things like \"a valid Bearer token\"); refer to the credential generically, for example \"the value you sent\".",
    "Never invent a cause. If no concrete request-side fault is supported by the evidence, return {\"identifiable\": false}.",
    "",
    "EXAMPLES:",
    'Request: GET https://api.weather.example/data?city=London  |  Authorization: Bearer ****\\nResponse: 401 {"message":"Invalid API key"}\\nKnown: this API expects the key in the `appid` query parameter.\\n=> {"identifiable":true,"title":"Key in wrong place","message":"This API expects your key in the `appid` query parameter, not an Authorization header.","evidence":"Invalid API key","confidence":"high","headerFix":null,"valueFix":null}',
    'Request: GET https://api.example.com/v1/me  |  Authorization: Bearer ****\\nResponse: 401 {"error":"Missing x-api-key header"}\\nKnown: this API expects the key in the `x-api-key` header.\\n=> {"identifiable":true,"title":"Wrong auth header","message":"Send your key in the `x-api-key` header instead of `Authorization`.","evidence":"Missing x-api-key header","confidence":"high","headerFix":{"from":"Authorization","to":"x-api-key","stripScheme":true},"valueFix":null}',
    'Request: GET https://api.example.com/v1/me  |  x-api-key: ****\\nResponse: 403 {"error":"Invalid or expired API key"}\\nKnown: this API expects the key in the `x-api-key` header.\\n=> {"identifiable":true,"title":"Invalid API key","message":"Your `x-api-key` value is invalid or expired; replace it with a valid key.","evidence":"Invalid or expired API key","confidence":"high","headerFix":null,"valueFix":{"key":"x-api-key","stripScheme":false},"methodFix":null}',
    'Request: GET https://api.example.com/v1/items\\nResponse: 405 {"error":"Method Not Allowed"}\\nResponse header: Allow: POST\\n=> {"identifiable":true,"title":"Wrong Method","message":"This endpoint doesn\'t accept GET; the Allow header lists POST only.","evidence":"Allow: POST","confidence":"high","headerFix":null,"valueFix":null,"methodFix":"POST"}',
    'Request: GET https://api.example.com/v1/items  |  Authorization: Bearer ****\\nResponse: 503 {"error":"upstream unavailable"}\\n=> {"identifiable":false}',
    "",
    "Return JSON only.",
  ].join("\n");

  const text = await callAIJson(prompt, {
    temperature: 0.1,
    timeoutMs: 8000,
    deadlineMs: 20000,
    validate: (t) => {
      let parsed: unknown;
      try {
        const cleaned = t.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return false;
      }
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof (parsed as Record<string, unknown>).identifiable !== "boolean"
      ) {
        return false;
      }
      if ((parsed as Record<string, unknown>).identifiable === false) {
        return true;
      }
      const r = parsed as Record<string, unknown>;
      return (
        typeof r.title === "string" &&
        !!r.title.trim() &&
        typeof r.message === "string" &&
        !!r.message.trim()
      );
    },
  });

  let parsed: DiagnosisResult;
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return Promise.reject(new Error("AI returned invalid JSON"));
  }
  if (parsed && parsed.identifiable === false) {
    return { identifiable: false };
  }
  if (
    !parsed ||
    parsed.identifiable !== true ||
    typeof parsed.title !== "string" ||
    !parsed.title.trim() ||
    typeof parsed.message !== "string" ||
    !parsed.message.trim()
  ) {
    return Promise.reject(new Error("AI missing diagnosis fields"));
  }
  const fix = parsed.headerFix;
  const headerFix =
    fix &&
    typeof fix.from === "string" &&
    fix.from.trim() &&
    typeof fix.to === "string" &&
    fix.to.trim() &&
    fix.from.trim().toLowerCase() !== fix.to.trim().toLowerCase()
      ? {
          from: fix.from.trim(),
          to: fix.to.trim(),
          stripScheme: Boolean(fix.stripScheme),
        }
      : null;
  const vf = parsed.valueFix;
  const hasHeader = Object.keys(input.requestHeaders ?? {}).some(
    (k) => k.toLowerCase() === (typeof vf?.key === "string" ? vf.key.trim() : "").toLowerCase(),
  );
  const valueFix =
    !headerFix &&
    vf &&
    typeof vf.key === "string" &&
    vf.key.trim() &&
    typeof vf.stripScheme === "boolean" &&
    hasHeader
      ? { key: vf.key.trim(), stripScheme: vf.stripScheme }
      : null;
  const mf = parsed.methodFix;
  const methodFix =
    typeof mf === "string" &&
    mf.trim().toUpperCase() !== input.method.trim().toUpperCase() &&
    isAllowedMethod(mf)
      ? mf.trim().toUpperCase()
      : null;
  const rawConfidence = parsed.confidence;
  const confidence: DiagnosisConfidence | undefined =
    rawConfidence === "high" || rawConfidence === "medium" || rawConfidence === "low"
      ? rawConfidence
      : undefined;
  const evidence =
    typeof parsed.evidence === "string" && parsed.evidence.trim()
      ? parsed.evidence.trim().slice(0, 300)
      : undefined;
  return applyAuthGuards(
    hint,
    {
      identifiable: true,
      title: parsed.title.trim(),
      message: parsed.message.trim(),
      evidence,
      confidence,
      headerFix,
      valueFix,
      methodFix,
    },
    input,
  );
}

// Rule-based checks applied after the model answers. They cannot add a fix the
// schema cannot express, but they can remove a fix that contradicts a known
// convention or is under-confident, so the user is never handed a one-click
// action that is known to be wrong.
function applyAuthGuards(
  hint: AuthHint | null,
  result: DiagnosisResult,
  input: DiagnosisInput,
): DiagnosisResult {
  if (!result.identifiable) return result;

  let headerFix = result.headerFix ?? null;
  let valueFix = result.valueFix ?? null;
  let methodFix = result.methodFix ?? null;
  let message = result.message ?? "";
  let confidence = result.confidence;

  const queryParam =
    hint && hint.expected.kind === "query" ? hint.expected.params[0] : undefined;

  // Under-confident fixes are not actionable enough to offer as one-click.
  if (result.confidence === "low" && (headerFix || valueFix || methodFix)) {
    headerFix = null;
    valueFix = null;
    methodFix = null;
  }

  // A method switch is only offered when the response itself proves the fault
  // (405) and names the correct method (Allow header or response text). Without
  // that evidence the button would be guessing the target method.
  if (methodFix && input.status !== 405) {
    methodFix = null;
  }
  const allowHeader = (
    (input.responseHeaders && input.responseHeaders["allow"]) ||
    ""
  ).toLowerCase();
  const body = String(input.responseBody ?? "").toLowerCase();
  if (methodFix && !allowHeader.includes(methodFix.toLowerCase()) && !body.includes(methodFix.toLowerCase())) {
    methodFix = null;
  }

  // Public endpoints take no credentials.
  if (hint?.expected.kind === "none" && (headerFix || valueFix)) {
    headerFix = null;
    valueFix = null;
  }

  // The schema only expresses header renames and header-value replacements. When
  // the host puts the key in a query parameter, any header-based fix is wrong,
  // so drop it and make sure the message names the parameter.
  if (queryParam && (headerFix || valueFix)) {
    headerFix = null;
    valueFix = null;
    if (!message.toLowerCase().includes(queryParam.toLowerCase())) {
      message = `This API expects the key in the \`${queryParam}\` query parameter, not in a request header.`;
    }
  }

  // No known convention for this host: a one-click fix would have to guess how
  // the API expects its credential. Keep a header rename only when the response
  // body itself names the target header; drop a same-header value rewrite
  // entirely (with stripScheme false it is a no-op, and there is no evidence for
  // the expected value). Confidence cannot exceed "medium" without a convention.
  if (!hint) {
    const hay = (typeof body === "string" ? body : String(body ?? "")).toLowerCase();
    const namedInBody = (name: string) =>
      name.length > 0 && hay.includes(name.toLowerCase());
    if (headerFix && !namedInBody(headerFix.to)) headerFix = null;
    valueFix = null;
    if (confidence === "high") confidence = "medium";
  }

  // The schema only ever expresses one fix per diagnosis; enforce it on the
  // way out so the card never shows two competing one-click actions.
  if (methodFix) {
    headerFix = null;
    valueFix = null;
  } else if (headerFix || valueFix) {
    methodFix = null;
  }

  return { ...result, message, confidence, headerFix, valueFix, methodFix };
}
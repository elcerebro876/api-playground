import { callAIJson } from "@/lib/ai";

export const DIAGNOSIS_MAX_USES = 5;

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
  headerFix?: DiagnosisFix | null;
  valueFix?: DiagnosisValueFix | null;
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

  const prompt = [
    "You diagnose why a single HTTP request failed.",
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
    "",
    "Decide whether there is an IDENTIFIABLE, concrete cause for this failure that is grounded in the request above - for example the API expects a different auth scheme or header key, a required header is missing, the wrong parameter or content type is used, or the URL path does not exist.",
    "",
    'If an identifiable cause exists, return STRICT JSON with exactly these fields: {"identifiable": true, "title": "<short title, max 6 words>", "message": "<one sentence, under ~28 words, naming the exact wrong field>", "headerFix": {"from": "<WrongHeader>", "to": "<CorrectHeader>", "stripScheme": true}, "valueFix": {"key": "<HeaderName>", "stripScheme": true}}. Populate at most one of headerFix or valueFix (or set both to null).',
    "headerFix must be set ONLY when the same secret value the user already sent should be moved verbatim from the request header \"from\" to the request header \"to\" (set stripScheme true when the value must drop a leading \"Bearer \"/\"Basic \" style scheme word, false when the value must keep it).",
    'If no such concrete, actionable cause exists (ambiguous or empty error message, the failure cannot be pinned to a request-side fault), return STRICT JSON with exactly: {"identifiable": false}.',
    "headerFix must NOT repeat the same header name in both from and to (compare case-insensitively): it is only for moving a value to a DIFFERENT header.",
    'When the failure is caused by an invalid, expired, wrong, or missing VALUE inside a correctly-named header that the user DID send (e.g. a 401 with message like "Invalid API key"), the cause is identifiable: set title and message, set headerFix to null, and set valueFix: {"key": "<ThatHeaderName>", "stripScheme": true} where the value inside that header must be REPLACED by the user (set stripScheme true when the current value carries a leading "Bearer "/"Basic " scheme word, so the user pastes the raw secret without it).',
    'valueFix.key must be one of the auth headers actually present in the request AND correctly named for that API (authorization, x-api-key, api-key, token, cookie, or similar), where ONLY the secret value inside it is faulty. valueFix means: the header name is right, but the value is invalid/expired/wrong and must be replaced. Never use valueFix when the header the API expects is DIFFERENT from what the user sent - if the wrong header name was used, set headerFix instead (move the value to the correct header); if the header is missing entirely, do not set valueFix at all.',
    "Never invent causes. Return JSON only.",
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
  return {
    identifiable: true,
    title: parsed.title.trim(),
    message: parsed.message.trim(),
    headerFix,
    valueFix,
  };
}
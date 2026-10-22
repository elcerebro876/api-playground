export const EXPLAIN_INPUT_LIMIT = 16 * 1024;

export type ExplainEligibilityInput = {
  status?: number;
  body?: string;
  headers?: Record<string, string>;
  isBinary?: boolean;
  truncated?: boolean;
  error?: string;
};

export type ExplainEligibility =
  | { ok: true; truncated: boolean }
  | {
      ok: false;
      reason: "error" | "status" | "binary" | "empty" | "content-type" | "json";
    };

const JSON_CONTENT_TYPE_RE =
  /^application\/(?:[a-z0-9!#$&^_.+-]*\+)?json(?:\s*;|$)/i;

function contentTypeOf(headers?: Record<string, string>): string {
  if (!headers) return "";
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "content-type") return value;
  }
  return "";
}

export function isExplainEligible(
  resp: ExplainEligibilityInput | null | undefined,
): ExplainEligibility {
  if (!resp || resp.error) return { ok: false, reason: "error" };
  if (
    typeof resp.status !== "number" ||
    resp.status < 200 ||
    resp.status > 299
  ) {
    return { ok: false, reason: "status" };
  }
  if (resp.isBinary) return { ok: false, reason: "binary" };

  const contentType = contentTypeOf(resp.headers).trim();
  if (!JSON_CONTENT_TYPE_RE.test(contentType)) {
    return { ok: false, reason: "content-type" };
  }

  const body = resp.body ?? "";
  if (!body.trim()) return { ok: false, reason: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, reason: "json" };
  }
  if (parsed === null || typeof parsed !== "object") {
    return { ok: false, reason: "json" };
  }

  return { ok: true, truncated: resp.truncated === true };
}

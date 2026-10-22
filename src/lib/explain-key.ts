import { SECRET_HEADER_RE, SECRET_QUERY_RE } from "@/lib/diagnose";

const MAX_SHAPE_DEPTH = 4;
const MAX_SHAPE_ENTRIES = 40;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NUMBER_RE = /^\d+$/;
const LONG_HEX_RE = /^[0-9a-f]{16,}$/i;

export type ExplainCacheKeyInput = {
  method: string;
  url: string;
  status: number;
  contentType: string;
  body: string;
  credentialed?: boolean;
  headers?: Record<string, string>;
};

function leafType(value: unknown): string {
  if (value === null || value === undefined) return "z";
  if (typeof value === "number" || typeof value === "bigint") return "n";
  if (typeof value === "boolean") return "b";
  return "s";
}

export function structureSignature(json: unknown): string {
  const entries: string[] = [];

  const walk = (value: unknown, path: string, depth: number): void => {
    if (entries.length >= MAX_SHAPE_ENTRIES || depth > MAX_SHAPE_DEPTH) return;

    if (Array.isArray(value)) {
      entries.push(`${path}[]`);
      if (value.length > 0) {
        walk(value[0], `${path}[]`, depth + 1);
      }
      return;
    }

    if (value !== null && typeof value === "object") {
      for (const key of Object.keys(value).sort()) {
        walk(
          (value as Record<string, unknown>)[key],
          path ? `${path}.${key}` : key,
          depth + 1,
        );
      }
      return;
    }

    entries.push(`${path}:${leafType(value)}`);
  };

  walk(json, "", 0);
  return entries.slice(0, MAX_SHAPE_ENTRIES).join("|");
}

export function contentTypeFamily(contentType: string): string {
  const media = contentType.split(";")[0].trim().toLowerCase();
  if (!media) return "unknown";
  if (/^application\/(?:[a-z0-9!#$&^_.+-]*\+)?json$/.test(media)) return "json";
  if (media === "text/plain") return "text";
  return media;
}

function templateSegment(segment: string): string {
  if (!segment) return segment;
  if (UUID_RE.test(segment)) return ":x";
  if (DATE_RE.test(segment)) return ":x";
  if (NUMBER_RE.test(segment)) return ":x";
  if (LONG_HEX_RE.test(segment)) return ":x";
  return segment;
}

function pathTemplate(pathname: string): string {
  const segments = pathname.split("/").map(templateSegment);
  const template = segments.join("/");
  return template || "/";
}

function hasSecretHeader(headers?: Record<string, string>): boolean {
  if (!headers) return false;
  return Object.keys(headers).some((key) =>
    SECRET_HEADER_RE.test(key.toLowerCase()),
  );
}

export function explainCacheKey(
  input: ExplainCacheKeyInput,
): string | null {
  let url: URL;
  try {
    url = new URL(input.url);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const secretQueryKeys = [...url.searchParams.keys()].filter((key) =>
    SECRET_QUERY_RE.test(key),
  );
  if (
    input.credentialed ||
    hasSecretHeader(input.headers) ||
    url.username ||
    url.password ||
    secretQueryKeys.length > 0
  ) {
    return null;
  }

  const queryKeys = [...new Set([...url.searchParams.keys()])]
    .filter((key) => !SECRET_QUERY_RE.test(key))
    .sort();
  const port = url.port || (url.protocol === "https:" ? "443" : "80");

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.body);
  } catch {
    parsed = input.body;
  }

  return [
    "v1",
    input.method.toUpperCase(),
    `${url.protocol}//${url.hostname}:${port}${pathTemplate(url.pathname)}`,
    String(input.status),
    contentTypeFamily(input.contentType),
    structureSignature(parsed),
    queryKeys.join(","),
  ].join("|");
}

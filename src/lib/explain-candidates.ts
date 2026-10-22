import { sameOrigin } from "@/lib/diagnose";

export type CandidateSource = "pagination" | "url-field" | "id";

export type Candidate = {
  id: string;
  url: string;
  label: string;
  source: CandidateSource;
};

export type CandidateInput = {
  requestUrl: string;
  method: string;
  body: string;
  responseHeaders?: Record<string, string>;
};

type RawCandidate = { url: string; source: CandidateSource };

const ID_RE = /^[A-Za-z0-9._~-]{1,128}$/;
const URL_FIELD_RE = /^(url|href|link|self|next|previous|prev)$/i;
const FK_RE = /^([A-Za-z][A-Za-z0-9]*)_id$/;
const TOKEN_GROUPS = [
  ["cursor", "next_cursor"],
  ["after", "next_after"],
  ["page_token", "next_page_token"],
];

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function walkObjects(
  value: unknown,
  depth: number,
  visit: (obj: Record<string, unknown>) => void,
): void {
  if (depth > 4 || value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) walkObjects(item, depth + 1, visit);
    return;
  }
  const obj = value as Record<string, unknown>;
  visit(obj);
  for (const child of Object.values(obj)) {
    walkObjects(child, depth + 1, visit);
  }
}

function dedupeKey(url: URL): string {
  const params = [...url.searchParams.entries()].sort(([ka, va], [kb, vb]) =>
    ka === kb ? va.localeCompare(vb) : ka.localeCompare(kb),
  );
  const search = params
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return `${url.protocol}//${url.host}${url.pathname}?${search}`;
}

function resolveUrl(
  raw: string,
  base: URL,
  allowQueryRelative: boolean,
): URL | null {
  const value = raw.trim();
  if (!value) return null;
  const looksAbsolute = /^https?:\/\//i.test(value);
  const looksPath = value.startsWith("/");
  const looksQuery = allowQueryRelative && value.startsWith("?");
  if (!looksAbsolute && !looksPath && !looksQuery) return null;

  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (!sameOrigin(base, url)) return null;
  url.hash = "";
  return url;
}

function segmentMatchesPrefix(segment: string, prefix: string): boolean {
  const s = segment.toLowerCase();
  const p = prefix.toLowerCase();
  if (s === p || s === `${p}s` || `${s}s` === p) return true;
  if (s.endsWith("ies") && `${s.slice(0, -3)}y` === p) return true;
  if (p.endsWith("ies") && `${p.slice(0, -3)}y` === s) return true;
  return false;
}

function parseLinkNext(header: string): string | null {
  for (const part of header.split(/,(?=\s*<)/)) {
    const match = part.match(/^\s*<([^>]*)>\s*(.*)$/);
    if (!match) continue;
    for (const param of match[2].split(";")) {
      const rel = param.match(/^\s*rel\s*=\s*"?([^";]+)"?\s*$/i);
      if (!rel) continue;
      const tokens = rel[1].toLowerCase().split(/\s+/);
      if (tokens.includes("next")) return match[1].trim();
    }
  }
  return null;
}

function findHeader(
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === name) return value;
  }
  return undefined;
}

function asToken(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    const token = value.trim();
    return token.length <= 512 ? token : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

export function buildCandidates(input: CandidateInput): Candidate[] {
  const { requestUrl, body, responseHeaders } = input;

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return [];
  }

  let base: URL;
  try {
    base = new URL(requestUrl);
  } catch {
    return [];
  }
  if (base.protocol !== "http:" && base.protocol !== "https:") return [];
  if (base.username || base.password) return [];
  base.hash = "";

  const top = isObject(parsed) ? parsed : null;
  const lastSegment = (() => {
    const segments = base.pathname.split("/").filter(Boolean);
    const raw = segments.length ? segments[segments.length - 1] : "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  const detailResponse =
    top !== null && top.id != null && String(top.id) === lastSegment;

  const currentKey = dedupeKey(base);
  const used = new Set<string>([currentKey]);
  const ranked: RawCandidate[] = [];
  const urlFieldUrls: URL[] = [];
  const fkPairs: { prefix: string; value: string }[] = [];
  const bareIds: string[] = [];

  const add = (rawUrl: string, source: CandidateSource, allowQuery: boolean) => {
    const url = resolveUrl(rawUrl, base, allowQuery);
    if (!url) return;
    const key = dedupeKey(url);
    if (used.has(key)) return;
    used.add(key);
    ranked.push({ url: url.href, source });
  };

  const pagination: RawCandidate[] = [];
  const paginationSeen = new Set<string>();
  const addPagination = (rawUrl: string, allowQuery: boolean) => {
    const url = resolveUrl(rawUrl, base, allowQuery);
    if (!url) return;
    const key = dedupeKey(url);
    if (used.has(key) || paginationSeen.has(key)) return;
    paginationSeen.add(key);
    pagination.push({ url: url.href, source: "pagination" });
  };

  if (top) {
    if (typeof top.next === "string") addPagination(top.next, true);
    if (typeof top.next_page_url === "string") {
      addPagination(top.next_page_url, true);
    }
    if (isObject(top.paging) && typeof top.paging.next === "string") {
      addPagination(top.paging.next, true);
    }
  }

  const linkNext = parseLinkNext(findHeader(responseHeaders, "link") ?? "");
  if (linkNext) addPagination(linkNext, true);

  walkObjects(parsed, 0, (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && URL_FIELD_RE.test(key)) {
        const url = resolveUrl(value, base, false);
        if (url) urlFieldUrls.push(url);
      }

      if (
        ["next_cursor", "cursor", "after", "next_after", "page_token", "next_page_token"].includes(
          key,
        )
      ) {
        const token = asToken(value);
        if (token) {
          let param: string | null = null;
          if (base.searchParams.has(key)) {
            param = key;
          } else {
            const group = TOKEN_GROUPS.find((names) => names.includes(key));
            if (group) {
              param =
                group.find((name) => base.searchParams.has(name)) ?? null;
            }
          }
          if (param) {
            const next = new URL(base.href);
            next.searchParams.set(param, token);
            addPagination(next.href, true);
          }
        }
      }

      const fk = key.match(FK_RE);
      if (fk && (typeof value === "string" || typeof value === "number")) {
        const id = String(value);
        if (ID_RE.test(id)) fkPairs.push({ prefix: fk[1], value: id });
      }
    }
  });

  for (const candidate of pagination) {
    add(candidate.url, "pagination", false);
  }

  for (const url of urlFieldUrls) {
    add(url.href, "url-field", false);
  }

  if (!detailResponse) {
    const knownPaths = [base.pathname, ...urlFieldUrls.map((u) => u.pathname)];
    for (const fk of fkPairs) {
      for (const path of knownPaths) {
        const segments = path.split("/").filter(Boolean);
        const index = segments.findIndex((segment) =>
          segmentMatchesPrefix(segment, fk.prefix),
        );
        if (index === -1) continue;
        const collection = `/${segments.slice(0, index + 1).join("/")}`;
        add(`${base.origin}${collection}/${fk.value}`, "id", false);
        break;
      }
    }

    const arrayItems = Array.isArray(parsed)
      ? parsed
      : top && Array.isArray(top.data)
        ? top.data
        : null;
    if (arrayItems) {
      for (const item of [arrayItems[0], arrayItems[arrayItems.length - 1]]) {
        if (!isObject(item)) continue;
        const id = item.id;
        if (typeof id === "string" || typeof id === "number") {
          const value = String(id);
          if (ID_RE.test(value)) bareIds.push(value);
        }
      }
    } else if (top && (typeof top.id === "string" || typeof top.id === "number")) {
      const value = String(top.id);
      if (ID_RE.test(value)) bareIds.push(value);
    }

    const collectionPath = base.pathname.replace(/\/+$/, "");
    for (const id of bareIds) {
      add(`${base.origin}${collectionPath}/${id}`, "id", false);
    }
  }

  return ranked.slice(0, 3).map((candidate, index) => {
    const url = new URL(candidate.url);
    return {
      id: String(index),
      url: candidate.url,
      label: `GET ${url.pathname || "/"}${url.search}`,
      source: candidate.source,
    };
  });
}

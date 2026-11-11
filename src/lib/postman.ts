// Reads a Postman Collection v2.1 JSON export entirely in the browser. Only
// method + URL are kept for each request; scripts, examples, inherited auth,
// file uploads, and secrets are reported as skipped.

export const POSTMAN_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const POSTMAN_MAX_FOLDERS = 10;
export const POSTMAN_MAX_ENDPOINTS = 100;

export type PostmanRequest = {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  variableKeys: string[];
  missingKeys: string[];
  hasScript: boolean;
  examples: number;
  fileUploads: number;
  hasDescription: boolean;
};

export type PostmanFolder = {
  id: string;
  name: string;
  auth: boolean;
  requests: PostmanRequest[];
};

export type PostmanImport = {
  name: string;
  folders: PostmanFolder[];
  variables: Record<string, string>;
  missingVariables: string[];
  secretVariables: string[];
  stats: {
    totalRequests: number;
    folderCount: number;
    scripts: number;
    examples: number;
    inheritedAuth: number;
    fileUploads: number;
    descriptions: number;
    credentials: number;
  };
};

export type PostmanParseResult =
  | { ok: true; value: PostmanImport }
  | { ok: false; reason: "invalid" | "not_postman" | "unsupported_version" };

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readVariables(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(value)) return out;
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const key = asString(entry.key);
    if (!key) continue;
    out[key] = asString(entry.value);
  }
  return out;
}

export function isSecretVariable(key: string): boolean {
  return /token|secret|passw|credential|api[-_]?key|auth/i.test(key);
}

export function resolveVariables(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(/\{\{([^{}]+)\}\}/g, (match, key: string) => {
    const value = values[key.trim()];
    return value ? value : match;
  });
}

export function hasUnresolvedVariables(text: string): boolean {
  return /\{\{[^{}]+\}\}/.test(text);
}

function urlFromRequest(request: RecordValue): string {
  const url = request.url;
  if (typeof url === "string") return url;
  if (!isRecord(url)) return "";
  const raw = asString(url.raw);
  if (raw) return raw;
  const protocol = asString(url.protocol) || "https";
  const host = Array.isArray(url.host)
    ? url.host.map(asString).join(".")
    : asString(url.host);
  const path = Array.isArray(url.path)
    ? url.path.map(asString).join("/")
    : asString(url.path).replace(/^\//, "");
  if (!host) return "";
  const query = Array.isArray(url.query)
    ? url.query
        .map((entry) =>
          isRecord(entry)
            ? `${asString(entry.key)}=${asString(entry.value)}`
            : "",
        )
        .filter(Boolean)
        .join("&")
    : "";
  return `${protocol}://${host}${path ? `/${path}` : ""}${query ? `?${query}` : ""}`;
}

function headersFromRequest(request: RecordValue): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!Array.isArray(request.header)) return headers;
  for (const entry of request.header) {
    if (!isRecord(entry) || entry.disabled === true) continue;
    const key = asString(entry.key);
    if (!key) continue;
    headers[key] = asString(entry.value);
  }
  return headers;
}

function bodyFromRequest(request: RecordValue): {
  body: string | null;
  fileUploads: number;
} {
  const body = request.body;
  if (!isRecord(body)) return { body: null, fileUploads: 0 };
  const mode = asString(body.mode);
  if (mode === "raw") return { body: asString(body.raw), fileUploads: 0 };
  if (mode === "urlencoded" && Array.isArray(body.urlencoded)) {
    const params = new URLSearchParams();
    for (const entry of body.urlencoded) {
      if (!isRecord(entry) || entry.disabled === true) continue;
      params.append(asString(entry.key), asString(entry.value));
    }
    return { body: params.toString(), fileUploads: 0 };
  }
  if (mode === "formdata" && Array.isArray(body.formdata)) {
    const params = new URLSearchParams();
    let fileUploads = 0;
    for (const entry of body.formdata) {
      if (!isRecord(entry) || entry.disabled === true) continue;
      if (entry.type === "file") {
        fileUploads += 1;
      } else {
        params.append(asString(entry.key), asString(entry.value));
      }
    }
    return { body: params.toString(), fileUploads };
  }
  if (mode === "graphql" && isRecord(body.graphql)) {
    return { body: asString(body.graphql.query), fileUploads: 0 };
  }
  return { body: null, fileUploads: 0 };
}

function requestVariables(request: RecordValue): Record<string, string> {
  const out = readVariables(request.variable);
  const url = request.url;
  if (isRecord(url)) {
    Object.assign(out, readVariables(url.variable));
  }
  return out;
}

function variablesIn(text: string): string[] {
  const out: string[] = [];
  const re = /\{\{([^{}]+)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const key = match[1].trim();
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

function requestFromRaw(
  raw: RecordValue,
  id: string,
  inheritedVariables: Record<string, string>,
  inheritedAuth: boolean,
): PostmanRequest {
  const variables = { ...inheritedVariables, ...requestVariables(raw) };
  const url = urlFromRequest(raw);
  const headers = headersFromRequest(raw);
  const { body, fileUploads } = bodyFromRequest(raw);
  const text = [url, ...Object.values(headers), body ?? ""].join("\n");
  const variableKeys = variablesIn(text);
  const missingKeys = variableKeys.filter((key) => !variables[key]);
  const events = Array.isArray(raw.event) ? raw.event : [];
  const hasScript = events.some((event) => {
    if (!isRecord(event) || !isRecord(event.script)) return false;
    return Array.isArray(event.script.exec)
      ? event.script.exec.length > 0
      : typeof event.script.exec === "string";
  });
  const examples = Array.isArray(raw.response) ? raw.response.length : 0;
  return {
    id,
    name: asString(raw.name) || "Untitled request",
    method: (asString(raw.method) || "GET").toUpperCase(),
    url,
    headers,
    body,
    variableKeys,
    missingKeys,
    hasScript,
    examples,
    fileUploads,
    hasDescription: Boolean(raw.description),
  };
}

function collectFolder(
  folder: RecordValue,
  folderId: string,
  inheritedVariables: Record<string, string>,
  inheritedAuth: number,
  nextId: () => string,
): PostmanFolder {
  const variables = {
    ...inheritedVariables,
    ...readVariables(folder.variable),
  };
  const folderAuth = isRecord(folder.auth) ? 1 : 0;
  const auth = inheritedAuth + folderAuth;
  const requests: PostmanRequest[] = [];
  const children = Array.isArray(folder.item) ? folder.item : [];
  for (const child of children) {
    if (!isRecord(child)) continue;
    if (Array.isArray(child.item)) {
      const nested = collectFolder(
        child,
        `${folderId}-${nextId()}`,
        variables,
        auth,
        nextId,
      );
      requests.push(...nested.requests);
    } else if (isRecord(child.request)) {
      requests.push(
        requestFromRaw(child.request, nextId(), variables, auth > 0),
      );
    }
  }
  return {
    id: folderId,
    name: asString(folder.name) || "Untitled folder",
    auth: auth > 0,
    requests,
  };
}

export function parsePostmanCollection(
  input: unknown,
): PostmanParseResult {
  if (!isRecord(input)) return { ok: false, reason: "invalid" };
  const info = isRecord(input.info) ? input.info : null;
  const schema = info ? asString(info.schema) : "";
  if (schema && /v1/i.test(schema) && !/v2/i.test(schema)) {
    return { ok: false, reason: "unsupported_version" };
  }
  if (!Array.isArray(input.item)) {
    return { ok: false, reason: "not_postman" };
  }

  let idCounter = 0;
  const nextId = () => `item-${++idCounter}`;
  const collectionVariables = readVariables(input.variable);
  const collectionAuth = isRecord(input.auth) ? 1 : 0;
  const folders: PostmanFolder[] = [];
  const rootRequests: PostmanRequest[] = [];

  for (const item of input.item) {
    if (!isRecord(item)) continue;
    if (Array.isArray(item.item)) {
      folders.push(
        collectFolder(
          item,
          nextId(),
          collectionVariables,
          collectionAuth,
          nextId,
        ),
      );
    } else if (isRecord(item.request)) {
      rootRequests.push(
        requestFromRaw(item.request, nextId(), collectionVariables, Boolean(collectionAuth)),
      );
    }
  }
  if (rootRequests.length) {
    folders.push({
      id: nextId(),
      name: asString(info?.name) || "Requests",
      auth: collectionAuth > 0,
      requests: rootRequests,
    });
  }

  const allRequests = folders.flatMap((folder) => folder.requests);
  const variables: Record<string, string> = { ...collectionVariables };
  for (const folder of folders) {
    for (const request of folder.requests) {
      for (const key of request.variableKeys) {
        if (variables[key] === undefined) {
          const known = collectionVariables[key];
          if (known !== undefined) variables[key] = known;
        }
      }
    }
  }
  const missing = new Set<string>();
  for (const request of allRequests) {
    for (const key of request.missingKeys) missing.add(key);
  }
  const missingVariables = Array.from(missing)
    .filter((key) => !isSecretVariable(key))
    .sort();
  const secretVariables = Array.from(missing)
    .filter(isSecretVariable)
    .sort();

  const scripts = allRequests.filter((request) => request.hasScript).length;
  const examples = allRequests.reduce(
    (total, request) => total + request.examples,
    0,
  );
  const fileUploads = allRequests.reduce(
    (total, request) => total + request.fileUploads,
    0,
  );
  const descriptions = allRequests.filter(
    (request) => request.hasDescription,
  ).length;
  const inheritedAuth =
    collectionAuth + folders.filter((folder) => folder.auth).length;

  let credentials = secretVariables.length;
  for (const request of allRequests) {
    for (const key of Object.keys(request.headers)) {
      if (/authorization|api[-_]?key|x-api-key/i.test(key)) credentials += 1;
    }
  }

  return {
    ok: true,
    value: {
      name: asString(info?.name) || "Postman collection",
      folders,
      variables,
      missingVariables,
      secretVariables,
      stats: {
        totalRequests: allRequests.length,
        folderCount: folders.length,
        scripts,
        examples,
        inheritedAuth,
        fileUploads,
        descriptions,
        credentials,
      },
    },
  };
}

export function folderFits(
  folder: PostmanFolder,
  selectedFolders: number,
  selectedEndpoints: number,
  freeFolders: number,
  freeEndpoints: number,
): boolean {
  return (
    selectedFolders < freeFolders &&
    selectedEndpoints + folder.requests.length <= freeEndpoints
  );
}

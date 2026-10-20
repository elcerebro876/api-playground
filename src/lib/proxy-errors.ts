export class ProxyError extends Error {
  readonly source = "proxy";
  constructor(readonly code: string) {
    super(code);
  }
}

export const PROXY_ERROR_MESSAGES: Record<string, string> = {
  blocked_target: "Blocked by proxy",
  blocked_port: "Blocked port",
  bad_url: "Invalid or unsupported URL",
  bad_request: "Invalid request",
  rate_limited: "Too many proxy requests, try again later",
  store_unavailable: "Proxy is temporarily unavailable. Please try again later.",
  timeout: "Upstream timed out",
  upstream_failed: "Upstream request failed",
  too_many_redirects: "Too many redirects",
  host_not_found: "Couldn't find that host. Check the spelling of the domain.",
};

export function proxyErrorResponse(
  code: string,
  time: number,
  extra?: { retryAfterSec?: number },
): Response {
  const status =
    code === "blocked_port"
      ? 403
      : code === "rate_limited"
        ? 429
        : code === "store_unavailable"
          ? 503
          : 500;
  const body: Record<string, unknown> = {
    error: PROXY_ERROR_MESSAGES[code] ?? PROXY_ERROR_MESSAGES.upstream_failed,
    source: "proxy",
    code,
    time,
  };
  const retryAfterSec = extra?.retryAfterSec;
  if (typeof retryAfterSec === "number") body.retryAfterSec = retryAfterSec;
  return Response.json(body, {
    status,
    headers:
      typeof retryAfterSec === "number"
        ? { "Retry-After": String(retryAfterSec) }
        : undefined,
  });
}

export function targetSuccessResponse(params: {
  status: number;
  ok: boolean;
  time: number;
  headers: Record<string, string>;
  body: string;
  truncated: boolean;
  isBinary?: boolean;
  encoding?: string;
}): Response {
  return Response.json({
    status: params.status,
    ok: params.ok,
    time: params.time,
    headers: params.headers,
    body: params.body,
    truncated: params.truncated,
    ...(params.isBinary
      ? { isBinary: true, encoding: params.encoding || "base64" }
      : {}),
  });
}

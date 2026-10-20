export type ProxyErrorEnvelope = {
  source: "proxy";
  code: string;
  error?: string;
  retryAfterSec?: number;
  time?: number;
};

export const PROXY_ERROR_COPY: Record<string, string> = {
  blocked_target:
    "This target was blocked by the proxy because it points to a private or internal address.",
  blocked_port:
    "Only the default port, 80, and 443 are allowed through the proxy.",
  bad_url: "That URL isn't valid. Only http and https URLs are supported.",
  bad_request: "The proxy couldn't use this request. Check the method and URL.",
  rate_limited: "Too many proxy requests. Wait a moment and try again.",
  store_unavailable: "The proxy is temporarily unavailable. Try again shortly.",
  timeout: "The upstream request timed out after 20 seconds.",
  upstream_failed: "The upstream request failed. Check the URL and try again.",
  too_many_redirects:
    "The target redirected too many times, so the proxy stopped following.",
  host_not_found: "Couldn't find that host. Check the spelling of the domain.",
};

export function isProxyErrorEnvelope(
  data: unknown,
): data is ProxyErrorEnvelope {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    d.source === "proxy" &&
    typeof d.code === "string" &&
    typeof d.status !== "number"
  );
}

export function proxyErrorCopy(code: string): string {
  return PROXY_ERROR_COPY[code] ?? PROXY_ERROR_COPY.upstream_failed;
}

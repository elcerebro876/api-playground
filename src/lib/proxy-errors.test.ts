import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROXY_ERROR_MESSAGES,
  ProxyError,
  proxyErrorResponse,
  targetSuccessResponse,
} from "@/lib/proxy-errors";

const CODES = [
  "blocked_target",
  "blocked_port",
  "bad_url",
  "bad_request",
  "rate_limited",
  "store_unavailable",
  "timeout",
  "upstream_failed",
  "too_many_redirects",
  "host_not_found",
] as const;

test("every proxy error code carries source, code, and the fixed generic message", async () => {
  const expectedStatus: Record<string, number> = {
    blocked_port: 403,
    rate_limited: 429,
    store_unavailable: 503,
  };
  for (const code of CODES) {
    const res = proxyErrorResponse(code, 12);
    assert.equal(res.status, expectedStatus[code] ?? 500, code);
    const body = await res.json();
    assert.equal(body.source, "proxy", code);
    assert.equal(body.code, code, code);
    assert.equal(body.error, PROXY_ERROR_MESSAGES[code], code);
    assert.equal(body.time, 12, code);
  }
});

test("ProxyError carries source and code for every known code", () => {
  for (const code of CODES) {
    const err = new ProxyError(code);
    assert.equal(err.source, "proxy", code);
    assert.equal(err.code, code, code);
  }
});

test("upstream_failed has a generic body with no room for raw error text", async () => {
  const res = proxyErrorResponse("upstream_failed", 5);
  const body = await res.json();
  assert.equal(body.error, "Upstream request failed");
  assert.deepEqual(Object.keys(body).sort(), ["code", "error", "source", "time"]);
});

test("rate_limited carries retryAfterSec in the body and the Retry-After header", async () => {
  const res = proxyErrorResponse("rate_limited", 3, { retryAfterSec: 42 });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("retry-after"), "42");
  const body = await res.json();
  assert.equal(body.retryAfterSec, 42);
  assert.equal(body.source, "proxy");
  assert.equal(body.code, "rate_limited");
});

test("non-rate-limit codes carry no retryAfterSec", async () => {
  const body = await proxyErrorResponse("store_unavailable", 3).json();
  assert.equal("retryAfterSec" in body, false);
});

test("target success envelopes never carry source or code, even if the target body spoofs them", async () => {
  const res = targetSuccessResponse({
    status: 403,
    ok: false,
    time: 9,
    headers: { "content-type": "application/json" },
    body: '{"source":"proxy","code":"blocked_target","error":"Injected"}',
    truncated: false,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 403);
  assert.equal(body.ok, false);
  assert.equal("source" in body, false);
  assert.equal("code" in body, false);
});

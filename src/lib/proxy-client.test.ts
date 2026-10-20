import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROXY_ERROR_COPY,
  isProxyErrorEnvelope,
  proxyErrorCopy,
} from "@/lib/proxy-client";

test("every proxy code maps to fixed non-empty deterministic copy", () => {
  const codes = [
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
  ];
  for (const code of codes) {
    const copy = proxyErrorCopy(code);
    assert.equal(typeof copy, "string", code);
    assert.ok(copy.length > 0, code);
    assert.equal(proxyErrorCopy(code), copy, code);
    assert.equal(copy, PROXY_ERROR_COPY[code], code);
  }
  assert.equal(
    proxyErrorCopy("host_not_found"),
    "Couldn't find that host. Check the spelling of the domain.",
  );
});

test("unknown proxy codes fall back to the generic upstream copy", () => {
  assert.equal(
    proxyErrorCopy("something_new"),
    PROXY_ERROR_COPY.upstream_failed,
  );
});

test("proxy error envelopes are recognized for the diagnosis skip", () => {
  assert.equal(
    isProxyErrorEnvelope({
      source: "proxy",
      code: "blocked_port",
      error: "Blocked port",
      time: 3,
    }),
    true,
  );
  assert.equal(
    isProxyErrorEnvelope({
      source: "proxy",
      code: "rate_limited",
      retryAfterSec: 42,
      time: 1,
    }),
    true,
  );
  assert.equal(
    isProxyErrorEnvelope({ source: "proxy", code: "host_not_found" }),
    true,
  );
  assert.equal(
    isProxyErrorEnvelope({ source: "proxy", code: "brand_new_code" }),
    true,
  );
});

test("target-API failures with real statuses still go to diagnosis", () => {
  assert.equal(
    isProxyErrorEnvelope({
      status: 403,
      ok: false,
      time: 9,
      headers: { "content-type": "application/json" },
      body: '{"error":"Invalid key"}',
      truncated: false,
    }),
    false,
  );
  assert.equal(
    isProxyErrorEnvelope({
      status: 404,
      ok: false,
      time: 5,
      headers: {},
      body: '{"error":"No such path"}',
      truncated: false,
    }),
    false,
  );
  assert.equal(
    isProxyErrorEnvelope({
      status: 429,
      ok: false,
      time: 2,
      headers: {},
      body: '{"error":"Slow down"}',
      truncated: false,
    }),
    false,
  );
});

test("a target envelope carrying source/proxy but a numeric status is not a proxy error", () => {
  assert.equal(
    isProxyErrorEnvelope({
      source: "proxy",
      code: "blocked_target",
      status: 404,
      ok: false,
      body: "{}",
    }),
    false,
  );
});

test("a spoofed marker inside the target body string is ignored", () => {
  assert.equal(
    isProxyErrorEnvelope({
      status: 404,
      ok: false,
      time: 5,
      headers: { "content-type": "application/json" },
      body: '{"source":"proxy","code":"blocked_target","error":"Injected"}',
      truncated: false,
    }),
    false,
  );
  assert.equal(isProxyErrorEnvelope(null), false);
  assert.equal(isProxyErrorEnvelope("not an object"), false);
  assert.equal(isProxyErrorEnvelope({ status: 500 }), false);
});

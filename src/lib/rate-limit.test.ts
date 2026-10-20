import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, hashKey } from "@/lib/rate-limit";

function req(headers: Record<string, string>) {
  return new Request("http://localhost/", { headers });
}

function withoutVercel(fn: () => void) {
  const prev = process.env.VERCEL;
  delete process.env.VERCEL;
  try {
    fn();
  } finally {
    if (prev !== undefined) process.env.VERCEL = prev;
  }
}

function withVercel(fn: () => void) {
  const prev = process.env.VERCEL;
  process.env.VERCEL = "1";
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prev;
  }
}

test("clientIp ignores client-supplied headers off Vercel", () => {
  withoutVercel(() => {
    assert.equal(clientIp(req({ "x-real-ip": "1.2.3.4" })), "unknown");
    assert.equal(
      clientIp(req({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "5.5.5.5" })),
      "unknown",
    );
    assert.equal(clientIp(req({})), "unknown");
  });
});

test("clientIp trusts Vercel edge headers", () => {
  withVercel(() => {
    assert.equal(
      clientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })),
      "1.2.3.4",
    );
    assert.equal(clientIp(req({ "x-real-ip": "7.7.7.7" })), "7.7.7.7");
    assert.equal(clientIp(req({})), "unknown");
  });
});

test("hashKey returns a hashed key that never contains the raw IP", async () => {
  const a = await hashKey("proxy", "9.9.9.9");
  const b = await hashKey("proxy", "9.9.9.9");
  const c = await hashKey("proxy", "8.8.8.8");
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^proxy:[0-9a-f]{64}$/);
  assert.equal(a.includes("9.9.9.9"), false);
});

test("proxy POST returns 429 in the proxy error shape when exhausted", async () => {
  process.env.SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-test";
  const rpcKeys: string[] = [];
  const origFetch = globalThis.fetch;
  globalThis.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const url = String(input instanceof Request ? input.url : input);
    if (!url.includes("/rpc/bump_rate_limit")) {
      throw new Error(`unexpected fetch in test: ${url}`);
    }
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    rpcKeys.push(String(body.k));
    return new Response(
      JSON.stringify({ ok: false, remaining: 0, retry_after: 42 }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof globalThis.fetch;
  try {
    process.env.VERCEL = "1";
    const { POST } = await import("@/app/api/proxy/route.js");
    const res = await POST(
      new Request("http://localhost/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "9.9.9.9",
        },
        body: JSON.stringify({ method: "GET", url: "https://example.com/" }),
      }),
    );
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "42");
    const data = await res.json();
    assert.equal(typeof data.error, "string");
    assert.equal(typeof data.time, "number");
    assert.equal(data.status, undefined);
    assert.equal(data.body, undefined);
    assert.equal(rpcKeys.length, 1);
    assert.match(rpcKeys[0], /^proxy:[0-9a-f]{64}$/);
    assert.equal(rpcKeys[0].includes("9.9.9.9"), false);
  } finally {
    globalThis.fetch = origFetch;
    delete process.env.VERCEL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

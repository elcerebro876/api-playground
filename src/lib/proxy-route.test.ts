import { test } from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://test-project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-test";
process.env.VERCEL = "1";

type ProxyPost = typeof import("@/app/api/proxy/route.js").POST;
let postFn: ProxyPost | null = null;
async function getPost(): Promise<ProxyPost> {
  if (!postFn) {
    const mod = await import("@/app/api/proxy/route.js");
    postFn = mod.POST;
  }
  return postFn;
}

function mockRpc(rpcResult: unknown) {
  const orig = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    if (!url.includes("/rpc/bump_rate_limit")) {
      throw new Error(`unexpected fetch in test: ${url}`);
    }
    return new Response(JSON.stringify(rpcResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = orig;
  };
}

function mockRpcDown(rawError: string) {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error(rawError);
  }) as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = orig;
  };
}

function proxyReq(payload: unknown) {
  return new Request("http://localhost/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "9.9.9.9",
    },
    body: JSON.stringify(payload),
  });
}

test("proxy 429 carries source, code, and retryAfterSec", async () => {
  const POST = await getPost();
  const restore = mockRpc({ ok: false, remaining: 0, retry_after: 42 });
  try {
    const res = await POST(
      proxyReq({ method: "GET", url: "https://example.com/" }),
    );
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "42");
    const data = await res.json();
    assert.equal(data.source, "proxy");
    assert.equal(data.code, "rate_limited");
    assert.equal(data.retryAfterSec, 42);
    assert.equal(typeof data.error, "string");
    assert.equal(typeof data.time, "number");
    assert.equal(data.status, undefined);
    assert.equal(data.body, undefined);
  } finally {
    restore();
  }
});

test("proxy 503 store_unavailable carries source and code without raw error text", async () => {
  const POST = await getPost();
  const restore = mockRpcDown("connection refused to internal-host 10.1.2.3");
  try {
    const res = await POST(
      proxyReq({ method: "GET", url: "https://example.com/" }),
    );
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.source, "proxy");
    assert.equal(data.code, "store_unavailable");
    assert.ok(!data.error.includes("10.1.2.3"));
    assert.ok(!data.error.includes("internal-host"));
  } finally {
    restore();
  }
});

test("proxy 403 blocked_port carries source and code", async () => {
  const POST = await getPost();
  const restore = mockRpc({ ok: true, remaining: 5, retry_after: 0 });
  try {
    const res = await POST(
      proxyReq({ method: "GET", url: "https://1.1.1.1:6379/secret" }),
    );
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.source, "proxy");
    assert.equal(data.code, "blocked_port");
    assert.equal(data.error, "Blocked port");
    assert.equal(data.status, undefined);
    assert.equal(data.body, undefined);
  } finally {
    restore();
  }
});

test("proxy 500 bad_url carries source and code for malformed and unsupported URLs", async () => {
  const POST = await getPost();
  const restore = mockRpc({ ok: true, remaining: 5, retry_after: 0 });
  try {
    for (const url of ["not a url", "ftp://1.1.1.1/x"]) {
      const res = await POST(proxyReq({ method: "GET", url }));
      assert.equal(res.status, 500, url);
      const data = await res.json();
      assert.equal(data.source, "proxy", url);
      assert.equal(data.code, "bad_url", url);
      assert.equal(data.error, "Invalid or unsupported URL", url);
    }
  } finally {
    restore();
  }
});

test("proxy 500 host_not_found for a typo'd domain, without raw DNS text", async () => {
  const POST = await getPost();
  const restore = mockRpc({ ok: true, remaining: 5, retry_after: 0 });
  try {
    const res = await POST(
      proxyReq({
        method: "GET",
        url: "https://definitely-not-a-real-host-xyzq123.invalid/",
      }),
    );
    assert.equal(res.status, 500);
    const data = await res.json();
    assert.equal(data.source, "proxy");
    assert.equal(data.code, "host_not_found");
    assert.equal(
      data.error,
      "Couldn't find that host. Check the spelling of the domain.",
    );
    assert.ok(!String(data.error).includes("ENOTFOUND"));
  } finally {
    restore();
  }
});

test("proxy 500 bad_request carries source and code for disallowed methods and missing urls", async () => {
  const POST = await getPost();
  const restore = mockRpc({ ok: true, remaining: 5, retry_after: 0 });
  try {
    const badMethod = await POST(
      proxyReq({ method: "TRACE", url: "https://1.1.1.1/" }),
    );
    assert.equal(badMethod.status, 500);
    const methodData = await badMethod.json();
    assert.equal(methodData.source, "proxy");
    assert.equal(methodData.code, "bad_request");
    assert.equal(methodData.error, "Invalid request");

    const missingUrl = await POST(proxyReq({ method: "GET" }));
    assert.equal(missingUrl.status, 500);
    const urlData = await missingUrl.json();
    assert.equal(urlData.source, "proxy");
    assert.equal(urlData.code, "bad_request");

    const badJson = await POST(
      new Request("http://localhost/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      }),
    );
    assert.equal(badJson.status, 500);
    const jsonData = await badJson.json();
    assert.equal(jsonData.source, "proxy");
    assert.equal(jsonData.code, "bad_request");
  } finally {
    restore();
  }
});

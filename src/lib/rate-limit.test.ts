import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp } from "@/lib/rate-limit";

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

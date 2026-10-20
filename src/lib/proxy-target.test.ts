import { test } from "node:test";
import assert from "node:assert/strict";
import { assertSafeTarget } from "@/lib/proxy-target";

test("assertSafeTarget allows default ports and explicit 80/443", async () => {
  const cases = [
    "https://1.1.1.1",
    "http://1.1.1.1",
    "https://1.1.1.1:443/path",
    "http://1.1.1.1:80/path",
    "https://1.1.1.1:80",
    "http://1.1.1.1:443",
  ];
  for (const u of cases) {
    const parsed = await assertSafeTarget(u);
    assert.ok(["", "80", "443"].includes(parsed.port), u);
  }
});

test("assertSafeTarget blocks ports 22, 3306, 6379, and 8080", async () => {
  const cases = [
    "https://1.1.1.1:22",
    "https://1.1.1.1:3306",
    "http://1.1.1.1:6379",
    "http://1.1.1.1:8080",
  ];
  for (const u of cases) {
    await assert.rejects(
      assertSafeTarget(u),
      (err) => {
        const e = err as { source?: string; code?: string };
        assert.equal(e.source, "proxy", u);
        assert.equal(e.code, "blocked_port", u);
        return true;
      },
      u,
    );
  }
});

test("a redirect from an allowed URL to a blocked port is rejected on the next hop", async () => {
  const first = await assertSafeTarget("https://1.1.1.1/v1/resource");
  const location = "http://1.1.1.1:6379/steal";
  const nextHop = new URL(location, first).toString();
  await assert.rejects(
    assertSafeTarget(nextHop),
    (err) => {
      const e = err as { source?: string; code?: string };
      return e.source === "proxy" && e.code === "blocked_port";
    },
  );
});

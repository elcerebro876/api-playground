import { test } from "node:test";
import assert from "node:assert/strict";
import { formatFreshness } from "@/lib/explain-freshness";

const NOW = Date.parse("2026-10-22T12:00:00.000Z");
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

test("a fresh explanation always says just now", () => {
  assert.equal(formatFreshness(iso(10 * 24 * 3600 * 1000), false, NOW), "Explained just now");
});

test("a cache hit under a minute says just now", () => {
  assert.equal(formatFreshness(iso(0), true, NOW), "Just now");
  assert.equal(formatFreshness(iso(59_999), true, NOW), "Just now");
});

test("a cache hit under a day reports hours", () => {
  assert.equal(formatFreshness(iso(60_000), true, NOW), "from cache 1h ago");
  assert.equal(formatFreshness(iso(5 * 3600 * 1000), true, NOW), "from cache 5h ago");
  assert.equal(
    formatFreshness(iso(24 * 3600 * 1000 - 1), true, NOW),
    "from cache 23h ago",
  );
});

test("a cache hit of a day or more reports days", () => {
  assert.equal(formatFreshness(iso(24 * 3600 * 1000), true, NOW), "from cache 1 days ago");
  assert.equal(
    formatFreshness(iso(3 * 24 * 3600 * 1000), true, NOW),
    "from cache 3 days ago",
  );
});

test("an unparseable timestamp degrades to just now", () => {
  assert.equal(formatFreshness("not a date", true, NOW), "Just now");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  savedExplainKey,
  trimSavedExplains,
  type SavedExplain,
} from "@/lib/storage";
import type { ExplainResult } from "@/lib/explain";

const result = {
  who: "",
  what: "",
  build: "",
  fromCache: false,
  createdAt: "2026-11-02T00:00:00.000Z",
  ttlSecs: 0,
  truncated: false,
} satisfies ExplainResult;

const saved = (key: string, savedAt: number): SavedExplain => ({
  key,
  result,
  savedAt,
});

test("the save key matches how the log de-duplicates entries", () => {
  assert.equal(
    savedExplainKey(" get ", " https://example.com/users/1 "),
    "GET https://example.com/users/1",
  );
});

test("saved explanations under the cap are all kept", () => {
  const map = Object.fromEntries(
    [saved("GET a", 1), saved("GET b", 2)].map((s) => [s.key, s]),
  );
  assert.deepEqual(trimSavedExplains(map, 100), map);
});

test("saved explanations over the cap keep the newest", () => {
  const entries = Array.from({ length: 105 }, (_, i) =>
    saved(`GET ${i}`, i),
  );
  const map = Object.fromEntries(entries.map((s) => [s.key, s]));
  const kept = trimSavedExplains(map, 100);
  assert.equal(Object.keys(kept).length, 100);
  assert.equal(kept["GET 0"], undefined);
  assert.equal(kept["GET 4"], undefined);
  assert.equal(kept["GET 5"]?.savedAt, 5);
  assert.equal(kept["GET 104"]?.savedAt, 104);
});

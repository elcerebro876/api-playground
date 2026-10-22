import { test } from "node:test";
import assert from "node:assert/strict";
import { explainCacheKey, structureSignature } from "@/lib/explain-key";

const base = {
  method: "GET",
  url: "https://api.example.com/v1/items",
  status: 200,
  contentType: "application/json; charset=utf-8",
  body: '{"id":"abc","name":"Ada"}',
};

function key(overrides: Partial<typeof base & { credentialed: boolean }>) {
  return explainCacheKey({ ...base, ...overrides });
}

test("the same shape with different values produces the same key", () => {
  const a = key({ body: '{"id":"abc","name":"Ada"}' });
  const b = key({ body: '{"id":"xyz","name":"Grace"}' });
  assert.equal(a, b);
});

test("different key names produce different signatures", () => {
  const a = key({ body: '{"id":"abc","name":"Ada"}' });
  const b = key({ body: '{"id":"abc","title":"Ada"}' });
  assert.notEqual(a, b);
});

test("array length does not affect the shape signature", () => {
  const one = structureSignature({ items: [{ id: 1 }] });
  const many = structureSignature({ items: [{ id: 1 }, { id: 2 }, { id: 3 }] });
  assert.equal(one, many);
});

test("method, status and path template change the key", () => {
  assert.notEqual(key({ method: "GET" }), key({ method: "POST" }));
  assert.notEqual(key({ status: 200 }), key({ status: 201 }));
  assert.notEqual(key({ url: "https://api.example.com/v1/items/" }), key({}));
});

test("raw body and path values never appear in the key", () => {
  const result = key({
    url: "https://api.example.com/v1/items/12345",
    body: '{"tokenValue":"super-unique-value-98765","name":"Ada"}',
  });
  assert.ok(result);
  assert.ok(!result.includes("super-unique-value-98765"));
  assert.ok(!result.includes("12345"));
  assert.ok(result.includes("/v1/items/:x"));
});

test("ids, dates, uuids and long hex segments collapse to :x", () => {
  const first = key({
    url: "https://api.example.com/v1/items/123/2026-10-22/0f8fad5b-d9cb-469f-a165-70867728950e/0123456789abcdef0123",
  });
  const second = key({
    url: "https://api.example.com/v1/items/999/2024-01-02/11111111-2222-3333-4444-555555555555/ffffffffffffffffffff",
  });
  assert.equal(first, second);
  assert.ok(first?.includes("/v1/items/:x/:x/:x/:x"));
});

test("credentialed requests return null", () => {
  assert.equal(key({ credentialed: true }), null);
  assert.equal(
    explainCacheKey({
      ...base,
      headers: { Authorization: "Bearer abc" },
    }),
    null,
  );
  assert.equal(
    explainCacheKey({ ...base, url: "https://user:pass@api.example.com/x" }),
    null,
  );
  assert.equal(
    explainCacheKey({ ...base, url: "https://api.example.com/x?api_key=abc" }),
    null,
  );
});

test("non-secret query keys are sorted and values are excluded", () => {
  const result = key({ url: "https://api.example.com/v1/items?b=2&a=1" });
  assert.ok(result);
  assert.equal(result.split("|").pop(), "a,b");
  assert.ok(!result.includes("b=2"));
  assert.ok(!result.includes("a=1"));
});

test("json content type variants share a family", () => {
  const a = key({ contentType: "application/json" });
  const b = key({ contentType: "application/ld+json" });
  const c = key({ contentType: "text/plain" });
  assert.equal(a?.split("|")[4], "json");
  assert.equal(b?.split("|")[4], "json");
  assert.notEqual(c?.split("|")[4], "json");
});

test("the signature caps at 40 entries", () => {
  const wide: Record<string, number> = {};
  for (let i = 0; i < 80; i += 1) wide[`key${i}`] = i;
  const signature = structureSignature(wide);
  assert.equal(signature.split("|").length, 40);
});

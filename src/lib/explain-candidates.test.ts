import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCandidates } from "@/lib/explain-candidates";

const requestUrl = "https://api.example.com/v1/items";

test("a bare id appends to the current collection path (first and last item)", () => {
  const candidates = buildCandidates({
    requestUrl,
    method: "GET",
    body: JSON.stringify([{ id: "a" }, { id: "b" }, { id: "c" }]),
  });
  assert.deepEqual(
    candidates.map((c) => c.url),
    ["https://api.example.com/v1/items/a", "https://api.example.com/v1/items/c"],
  );
  assert.equal(candidates[0].label, "GET /v1/items/a");
});

test("a detail response generates no id siblings, including prefixed ids", () => {
  const candidates = buildCandidates({
    requestUrl: "https://api.example.com/v1/charges/ch_123",
    method: "GET",
    body: JSON.stringify({ id: "ch_123", amount: 100 }),
  });
  assert.deepEqual(candidates, []);
});

test("a foreign key without a matching path prefix is skipped", () => {
  const candidates = buildCandidates({
    requestUrl: "https://api.example.com/v1/orders/42",
    method: "GET",
    body: JSON.stringify({ customer_id: "c_1" }),
  });
  assert.deepEqual(candidates, []);
});

test("a foreign key maps to its own collection when the prefix matches", () => {
  const candidates = buildCandidates({
    requestUrl: "https://api.example.com/v1/nodes",
    method: "GET",
    body: JSON.stringify({ node_id: "n_1" }),
  });
  assert.deepEqual(
    candidates.map((c) => c.url),
    ["https://api.example.com/v1/nodes/n_1"],
  );
});

test("a plural body path segment satisfies a singular foreign key prefix", () => {
  const candidates = buildCandidates({
    requestUrl: "https://api.example.com/v1/customers",
    method: "GET",
    body: JSON.stringify({ customer_id: "c_1" }),
  });
  assert.deepEqual(
    candidates.map((c) => c.url),
    ["https://api.example.com/v1/customers/c_1"],
  );
});

test("a Link rel=next header becomes a pagination candidate", () => {
  const candidates = buildCandidates({
    requestUrl,
    method: "GET",
    body: "{}",
    responseHeaders: {
      Link: '<https://api.example.com/v1/items?page=2>; rel="next"',
    },
  });
  assert.deepEqual(
    candidates.map((c) => ({ url: c.url, source: c.source })),
    [
      {
        url: "https://api.example.com/v1/items?page=2",
        source: "pagination",
      },
    ],
  );
});

test("an opaque cursor is used only when the request already carries it", () => {
  const withParam = buildCandidates({
    requestUrl: "https://api.example.com/v1/items?cursor=old",
    method: "GET",
    body: JSON.stringify({ next_cursor: "new" }),
  });
  assert.equal(withParam.length, 1);
  assert.equal(
    new URL(withParam[0].url).searchParams.get("cursor"),
    "new",
  );

  const withoutParam = buildCandidates({
    requestUrl,
    method: "GET",
    body: JSON.stringify({ next_cursor: "new" }),
  });
  assert.deepEqual(withoutParam, []);
});

test("a numeric next_page is never guessed into a query param", () => {
  const candidates = buildCandidates({
    requestUrl,
    method: "GET",
    body: JSON.stringify({ next_page: 2 }),
  });
  assert.deepEqual(candidates, []);
});

test("relative and absolute same-origin URL fields are both accepted", () => {
  const candidates = buildCandidates({
    requestUrl,
    method: "GET",
    body: JSON.stringify({
      next: "/v1/items?page=2",
      self: "https://api.example.com/v1/items/1",
    }),
  });
  assert.deepEqual(
    candidates.map((c) => c.url),
    [
      "https://api.example.com/v1/items?page=2",
      "https://api.example.com/v1/items/1",
    ],
  );
});

test("cross-origin URLs are dropped", () => {
  const candidates = buildCandidates({
    requestUrl,
    method: "GET",
    body: JSON.stringify({
      next: "https://other.example.com/v1/items?page=2",
      self: "https://other.example.com/v1/items/1",
    }),
  });
  assert.deepEqual(candidates, []);
});

test("URLs with userinfo are dropped", () => {
  const candidates = buildCandidates({
    requestUrl,
    method: "GET",
    body: JSON.stringify({
      self: "https://user:pass@api.example.com/v1/items/1",
    }),
  });
  assert.deepEqual(candidates, []);
});

test("duplicate candidates are collapsed across sources", () => {
  const candidates = buildCandidates({
    requestUrl,
    method: "GET",
    body: JSON.stringify({
      self: "https://api.example.com/v1/items/1",
      url: "https://api.example.com/v1/items/1",
      id: "1",
    }),
  });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].url, "https://api.example.com/v1/items/1");
});

test("the current request URL is dropped", () => {
  const candidates = buildCandidates({
    requestUrl: "https://api.example.com/v1/items?page=2",
    method: "GET",
    body: JSON.stringify({
      next: "https://api.example.com/v1/items?page=2",
    }),
  });
  assert.deepEqual(candidates, []);
});

test("bad JSON produces no candidates", () => {
  assert.deepEqual(
    buildCandidates({ requestUrl, method: "GET", body: "{nope" }),
    [],
  );
});

test("candidates rank pagination, then URL fields, then ids, capped at 3", () => {
  const candidates = buildCandidates({
    requestUrl,
    method: "GET",
    body: JSON.stringify({
      next: "/v1/items?page=2",
      self: "/v1/items/1",
      data: [{ id: "a" }, { id: "b" }, { id: "c" }],
    }),
  });
  assert.deepEqual(
    candidates.map((c) => ({ url: c.url, source: c.source, id: c.id })),
    [
      {
        url: "https://api.example.com/v1/items?page=2",
        source: "pagination",
        id: "0",
      },
      {
        url: "https://api.example.com/v1/items/1",
        source: "url-field",
        id: "1",
      },
      {
        url: "https://api.example.com/v1/items/a",
        source: "id",
        id: "2",
      },
    ],
  );
});

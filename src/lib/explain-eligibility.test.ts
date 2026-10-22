import { test } from "node:test";
import assert from "node:assert/strict";
import { isExplainEligible } from "@/lib/explain-eligibility";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

test("a 2xx JSON object is eligible", () => {
  assert.deepEqual(
    isExplainEligible({
      status: 200,
      headers: jsonHeaders,
      body: '{"id":"ch_123"}',
    }),
    { ok: true, truncated: false },
  );
});

test("a 2xx JSON array is eligible", () => {
  assert.equal(
    isExplainEligible({
      status: 200,
      headers: { "content-type": "application/json" },
      body: "[1,2,3]",
    }).ok,
    true,
  );
});

test("204, empty and whitespace bodies are not eligible", () => {
  assert.equal(
    isExplainEligible({ status: 204, headers: jsonHeaders, body: "" }).ok,
    false,
  );
  assert.equal(
    isExplainEligible({ status: 200, headers: jsonHeaders, body: "" }).ok,
    false,
  );
  assert.equal(
    isExplainEligible({ status: 200, headers: jsonHeaders, body: "  \n " })
      .ok,
    false,
  );
});

test("3xx, 4xx and 5xx responses are not eligible", () => {
  for (const status of [301, 400, 404, 500, 503]) {
    assert.equal(
      isExplainEligible({ status, headers: jsonHeaders, body: "{}" }).ok,
      false,
    );
  }
});

test("non-JSON content types are not eligible", () => {
  assert.equal(
    isExplainEligible({
      status: 200,
      headers: { "content-type": "text/plain" },
      body: "{}",
    }).ok,
    false,
  );
});

test("application/ld+json is eligible", () => {
  assert.equal(
    isExplainEligible({
      status: 200,
      headers: { "content-type": "application/ld+json" },
      body: '{"@context":"https://schema.org"}',
    }).ok,
    true,
  );
});

test("binary responses are not eligible", () => {
  assert.equal(
    isExplainEligible({
      status: 200,
      headers: jsonHeaders,
      body: "{}",
      isBinary: true,
    }).ok,
    false,
  );
});

test("unparseable or scalar JSON is not eligible", () => {
  assert.equal(
    isExplainEligible({ status: 200, headers: jsonHeaders, body: "{nope" }).ok,
    false,
  );
  assert.equal(
    isExplainEligible({ status: 200, headers: jsonHeaders, body: '"hello"' })
      .ok,
    false,
  );
  assert.equal(
    isExplainEligible({ status: 200, headers: jsonHeaders, body: "null" }).ok,
    false,
  );
});

test("a truncated 2xx JSON response is eligible and reports truncation", () => {
  assert.deepEqual(
    isExplainEligible({
      status: 200,
      headers: jsonHeaders,
      body: '{"data":[]}',
      truncated: true,
    }),
    { ok: true, truncated: true },
  );
});

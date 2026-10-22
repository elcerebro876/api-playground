import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXPLAIN_BODY_LIMIT,
  buildExplainPrompt,
  parseExplanation,
} from "@/lib/explain";

const base = {
  apiName: "Example",
  endpointUrl: "https://api.example.com/v1/items",
  status: 200,
};

test("buildExplainPrompt masks URL secrets before the model sees them", () => {
  const prompt = buildExplainPrompt({
    ...base,
    endpointUrl:
      "https://api.example.com/v1/items?api_key=sk_live_123456&page=2",
    responseBody: "{}",
  });
  assert.ok(!prompt.includes("sk_live_123456"));
  assert.ok(prompt.includes("api_key="));
});

test("buildExplainPrompt masks secret values in the response body", () => {
  const prompt = buildExplainPrompt({
    ...base,
    responseBody: '{"access_token":"supersecretvalue123","ok":true}',
  });
  assert.ok(!prompt.includes("supersecretvalue123"));
  assert.ok(prompt.includes("****"));
});

test("buildExplainPrompt caps the body at the explain limit", () => {
  const prompt = buildExplainPrompt({
    ...base,
    responseBody: "z".repeat(EXPLAIN_BODY_LIMIT + 500),
  });
  const zs = prompt.match(/z/g) ?? [];
  assert.equal(zs.length, EXPLAIN_BODY_LIMIT);
});

test("buildExplainPrompt labels an empty body instead of sending nothing", () => {
  const prompt = buildExplainPrompt({ ...base, responseBody: "" });
  assert.ok(prompt.includes("(empty response)"));
});

test("parseExplanation accepts the five-field payload", () => {
  const parsed = parseExplanation(
    JSON.stringify({
      target_users: "Backend developers",
      problem_solved: "Listing resources",
      request_action: "Fetched the items collection",
      expected_outcome: "Returned the first page of items",
      build_idea: "A small inventory dashboard",
    }),
  );
  assert.equal(parsed?.target_users, "Backend developers");
});

test("parseExplanation rejects missing fields and non-JSON", () => {
  assert.equal(parseExplanation("not json"), null);
  assert.equal(
    parseExplanation(
      JSON.stringify({
        target_users: "x",
        problem_solved: "x",
        request_action: "x",
        expected_outcome: "x",
      }),
    ),
    null,
  );
});

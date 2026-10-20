import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyAuthGuards,
  buildDiagnosisInput,
  diagnosisCacheKey,
  jsonBodyRequired,
  maskHeaderValue,
  maskUrlSecrets,
  statusLabel,
  stripFixes,
  type DiagnosisInput,
  type DiagnosisResult,
} from "@/lib/diagnose";

test("statusLabel covers only statuses that have product copy", () => {
  assert.equal(statusLabel(400), "Bad request");
  assert.equal(statusLabel(401), "Auth rejected by the API");
  assert.equal(statusLabel(403), "Auth rejected by the API");
  assert.equal(statusLabel(404), "Path not found");
  assert.equal(statusLabel(429), "Rate limited by the API");
  assert.equal(statusLabel(405), null);
  assert.equal(statusLabel(500), null);
  assert.equal(statusLabel(null), null);
  assert.equal(statusLabel(undefined), null);
});

test("maskHeaderValue keeps a scheme word and hides the secret", () => {
  assert.equal(maskHeaderValue("Bearer sk_live_abc123"), "Bearer ****");
  assert.equal(maskHeaderValue("sk_live_abc123"), "****");
  assert.equal(maskHeaderValue(""), "");
});

test("maskUrlSecrets hides secret query values but keeps names", () => {
  const masked = maskUrlSecrets("https://api.example.com/v1/me?appid=abc123&q=London");
  assert.ok(!masked.includes("abc123"));
  assert.ok(masked.includes("appid="));
  assert.ok(masked.includes("q=London"));
});

test("buildDiagnosisInput uppercases method and masks the url", () => {
  const input = buildDiagnosisInput({
    method: "get",
    url: "https://api.example.com/x?api_key=secret",
    requestHeaders: { Authorization: "Bearer tok" },
    status: 401,
    responseBody: '{"api_key":"secret"}',
  });
  assert.equal(input.method, "GET");
  assert.ok(!input.url.includes("secret"));
  assert.equal(input.requestHeaders.Authorization, "Bearer ****");
  assert.equal(input.status, 401);
  assert.ok(!input.responseBody!.includes('"secret"'));
});

test("diagnosisCacheKey is stable for identical inputs and splits on change", () => {
  const base = buildDiagnosisInput({
    method: "GET",
    url: "https://api.example.com/x",
    status: 404,
    responseBody: "nope",
  });
  const same = buildDiagnosisInput({
    method: "GET",
    url: "https://api.example.com/x",
    status: 404,
    responseBody: "nope",
  });
  const other = buildDiagnosisInput({
    method: "GET",
    url: "https://api.example.com/y",
    status: 404,
    responseBody: "nope",
  });
  assert.equal(diagnosisCacheKey(base), diagnosisCacheKey(same));
  assert.notEqual(diagnosisCacheKey(base), diagnosisCacheKey(other));
});

function fullResult(): DiagnosisResult {
  return {
    identifiable: true,
    title: "Wrong thing",
    message: "Some message",
    confidence: "high",
    headerFix: { from: "Authorization", to: "x-api-key", stripScheme: true },
    valueFix: { key: "Authorization", stripScheme: false },
    methodFix: "POST",
    urlFix: { from: "https://api.example.com/v1/charge", to: "/v1/charges" },
  };
}

function input(status: number, extra: Partial<DiagnosisInput> = {}): DiagnosisInput {
  return {
    method: "GET",
    url: "https://api.example.com/v1/charge",
    requestHeaders: { Authorization: "Bearer tok" },
    status,
    responseHeaders: {},
    responseBody: "{}",
    ...extra,
  };
}

test("A2: a 400 returns all four fixes null even with high confidence", () => {
  const out = applyAuthGuards(null, fullResult(), input(400));
  assert.equal(out.headerFix, null);
  assert.equal(out.valueFix, null);
  assert.equal(out.methodFix, null);
  assert.equal(out.urlFix, null);
});

test("A2: a 429 returns all four fixes null even with high confidence", () => {
  const out = applyAuthGuards(null, fullResult(), input(429));
  assert.equal(out.headerFix, null);
  assert.equal(out.valueFix, null);
  assert.equal(out.methodFix, null);
  assert.equal(out.urlFix, null);
});

test("A2: a 404 with a near-miss path still keeps its urlFix", () => {
  const out = applyAuthGuards(
    null,
    fullResult(),
    input(404, {
      responseBody: '{"error":"No such path /v1/charge. Did you mean /v1/charges?"}',
    }),
  );
  assert.ok(out.urlFix, "urlFix should survive a 404");
  assert.equal(out.urlFix!.to, "https://api.example.com/v1/charges");
  assert.equal(out.methodFix, null);
});

test("A2: a 405 with an Allow header still keeps its methodFix", () => {
  const out = applyAuthGuards(
    null,
    fullResult(),
    input(405, { responseHeaders: { allow: "POST" } }),
  );
  assert.equal(out.methodFix, "POST");
  assert.equal(out.headerFix, null);
  assert.equal(out.valueFix, null);
});

test("A2: a cached 400 carrying a fix is stripped on read", () => {
  const cached = fullResult();
  const stripped = stripFixes(cached, 400);
  assert.equal(stripped.headerFix, null);
  assert.equal(stripped.valueFix, null);
  assert.equal(stripped.methodFix, null);
  assert.equal(stripped.urlFix, null);
  assert.equal(stripped.title, cached.title);

  const stripped429 = stripFixes(fullResult(), 429);
  assert.equal(stripped429.headerFix, null);
  assert.equal(stripped429.urlFix, null);

  const untouched = stripFixes(fullResult(), 404);
  assert.ok(untouched.urlFix, "a 404 cached entry keeps its fix");
});

test("A3: jsonBodyRequired fires on missing/required body phrasing", () => {
  assert.equal(jsonBodyRequired('{"message":"Request body is required"}'), true);
  assert.equal(jsonBodyRequired('{"error":"Missing body"}'), true);
  assert.equal(jsonBodyRequired('{"error":"No body provided"}'), true);
  assert.equal(jsonBodyRequired('{"error":"A body is required"}'), true);
});

test("A3: jsonBodyRequired fires on JSON parse / media-type errors", () => {
  assert.equal(jsonBodyRequired('{"error":"invalid JSON"}'), true);
  assert.equal(jsonBodyRequired('{"error":"Unexpected end of JSON input"}'), true);
  assert.equal(jsonBodyRequired('{"error":"Malformed json payload"}'), true);
  assert.equal(jsonBodyRequired('{"error":"Unsupported media type"}'), true);
  assert.equal(jsonBodyRequired('{"error":"Content-Type must be application/json"}'), true);
  assert.equal(jsonBodyRequired('{"error":"Failed to parse json"}'), true);
});

test("A3: jsonBodyRequired stays silent on unrelated bodies", () => {
  assert.equal(jsonBodyRequired('{"data":[{"id":1}]}'), false);
  assert.equal(jsonBodyRequired('{"error":"Not found"}'), false);
  assert.equal(jsonBodyRequired('<html><body>502 Bad Gateway</body></html>'), false);
  assert.equal(jsonBodyRequired('See the json docs'), false);
  assert.equal(jsonBodyRequired(''), false);
  assert.equal(jsonBodyRequired(null), false);
  assert.equal(jsonBodyRequired(undefined), false);
  assert.equal(jsonBodyRequired('   '), false);
});

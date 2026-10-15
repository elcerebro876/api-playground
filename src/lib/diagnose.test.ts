import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDiagnosisInput,
  diagnosisCacheKey,
  maskHeaderValue,
  maskUrlSecrets,
  statusLabel,
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

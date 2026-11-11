import { test } from "node:test";
import assert from "node:assert/strict";
import {
  curlHeader,
  looksLikeCurlCommand,
  parseCurlCommand,
} from "@/lib/curl";

test("detects a pasted curl command and ignores plain URLs", () => {
  assert.equal(looksLikeCurlCommand("curl https://api.example"), true);
  assert.equal(looksLikeCurlCommand("  CURL -X GET https://api.example"), true);
  assert.equal(looksLikeCurlCommand("curl"), true);
  assert.equal(
    looksLikeCurlCommand("https://api.example/?q=curl"),
    false,
  );
  assert.equal(looksLikeCurlCommand(""), false);
});

test("parses method, URL, headers, and a JSON body", () => {
  const result = parseCurlCommand(
    `curl -X PATCH 'https://api.example/users/1' \\
      -H 'Authorization: Bearer sk-test' \\
      -H 'Content-Type: application/json' \\
      -H 'X-Trace-Id: trace-001' \\
      -d '{"name":"Ada","role":"engineer"}'`,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.method, "PATCH");
  assert.equal(result.value.url, "https://api.example/users/1");
  assert.equal(
    curlHeader(result.value.headers, "authorization"),
    "Bearer sk-test",
  );
  assert.equal(
    curlHeader(result.value.headers, "content-type"),
    "application/json",
  );
  assert.equal(curlHeader(result.value.headers, "x-trace-id"), "trace-001");
  assert.equal(result.value.body, '{"name":"Ada","role":"engineer"}');
  assert.equal(result.value.skippedCookies, false);
  assert.equal(result.value.skippedInsecure, false);
});

test("data implies POST while an explicit method wins", () => {
  const post = parseCurlCommand(`curl https://api.example -d "a=1"`);
  assert.equal(post.ok, true);
  if (post.ok) assert.equal(post.value.method, "POST");

  const put = parseCurlCommand(
    `curl -X PUT https://api.example -d "a=1"`,
  );
  assert.equal(put.ok, true);
  if (put.ok) assert.equal(put.value.method, "PUT");

  const get = parseCurlCommand(`curl https://api.example`);
  assert.equal(get.ok, true);
  if (get.ok) assert.equal(get.value.method, "GET");
});

test("handles double quotes, escaped quotes, and --flag=value forms", () => {
  const result = parseCurlCommand(
    `curl --request=POST --url=https://api.example \\"quoted\\" --header="X-Test: a b" --data-raw="{\\"ok\\":true}"`,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.method, "POST");
  assert.equal(result.value.url, "https://api.example");
  assert.equal(curlHeader(result.value.headers, "x-test"), "a b");
  assert.equal(result.value.body, '{"ok":true}');
});

test("-u becomes a Basic authorization header", () => {
  const result = parseCurlCommand(
    `curl https://api.example -u user:pass`,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(
    curlHeader(result.value.headers, "authorization"),
    "Basic dXNlcjpwYXNz",
  );
});

test("reports skipped cookies and TLS flags instead of dropping them", () => {
  const result = parseCurlCommand(
    `curl https://api.example -b "session=abc" -k`,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.skippedCookies, true);
  assert.equal(result.value.skippedInsecure, true);
});

test("rejects more than one command, missing URLs, and broken quotes", () => {
  assert.deepEqual(
    parseCurlCommand(
      `curl https://api.example; curl https://api.example/two`,
    ),
    { ok: false, reason: "multiple" },
  );
  assert.deepEqual(
    parseCurlCommand(`curl -X GET && curl https://api.example`),
    { ok: false, reason: "multiple" },
  );
  assert.deepEqual(parseCurlCommand(`curl -X GET`), {
    ok: false,
    reason: "no_url",
  });
  assert.deepEqual(parseCurlCommand(`curl 'https://api.example`), {
    ok: false,
    reason: "bad_quote",
  });
});

test("body files are rejected rather than sent as a literal @path", () => {
  assert.deepEqual(
    parseCurlCommand(`curl https://api.example -d @payload.json`),
    { ok: false, reason: "unsupported" },
  );
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPrivateIpv4,
  isPrivateIpv6,
  redirectHopHeaders,
  restrictCrossOriginHeaders,
  withoutSensitiveHeaders,
} from "@/lib/proxy-hardening";

test("isPrivateIpv4 covers loopback, metadata, CGNAT, 0.0.0.0/8 and RFC1918", () => {
  const blocked = [
    "0.0.0.0",
    "0.1.2.3",
    "10.0.0.1",
    "100.64.0.1",
    "100.127.255.255",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
  ];
  for (const ip of blocked) assert.equal(isPrivateIpv4(ip), true, ip);
  assert.equal(isPrivateIpv4("8.8.8.8"), false);
  assert.equal(isPrivateIpv4("100.63.255.255"), false);
  assert.equal(isPrivateIpv4("100.128.0.0"), false);
});

test("isPrivateIpv6 blocks hex-form IPv4-mapped and compatible bypasses", () => {
  const blocked = [
    "::",
    "::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::7f00:1",
    "::ffff:a00:1",
    "0:0:0:0:0:ffff:7f00:1",
    "0000:0000:0000:0000:0000:ffff:7f00:0001",
    "fc00::1",
    "fd12:3456::9",
    "fe80::1",
    "febf::1",
    "64:ff9b::1",
    "64:ff9b::7f00:1",
    "64:ff9b:1::1",
    "2002::1",
    "2002:c000:0204::1",
    "2001::1",
    "2001:0:7f00:1::1",
  ];
  for (const ip of blocked) assert.equal(isPrivateIpv6(ip), true, ip);
  const publicIps = [
    "2606:4700:1111::1111",
    "2001:4860:4860::8888",
    "::ffff:808:808",
  ];
  for (const ip of publicIps) assert.equal(isPrivateIpv6(ip), false, ip);
});

test("withoutSensitiveHeaders drops credentials and keeps the rest", () => {
  const out = withoutSensitiveHeaders({
    Authorization: "Bearer sk-123",
    Cookie: "session=abc",
    "Proxy-Authorization": "Basic xyz",
    "x-api-key": "k",
    "X-Amz-Security-Token": "t",
    "x-auth-token": "t2",
    "content-type": "application/json",
    Accept: "application/json",
    "x-request-id": "req-1",
    "x-keyword": "keep",
  });
  assert.deepEqual(out, {
    "content-type": "application/json",
    Accept: "application/json",
    "x-request-id": "req-1",
    "x-keyword": "keep",
  });
});

test("restrictCrossOriginHeaders keeps only the safe allowlist", () => {
  const out = restrictCrossOriginHeaders({
    accept: "*/*",
    "Accept-Language": "en",
    "Content-Type": "application/json",
    "User-Agent": "playground/1",
    apikey: "s1",
    Apikey: "s2",
    "x-apikey": "s3",
    "ocp-apim-subscription-key": "s4",
    authorization: "Bearer sk-123",
    "x-foo-credential": "s5",
    cookie: "session=abc",
    "x-request-id": "req-1",
  });
  assert.deepEqual(out, {
    accept: "*/*",
    "Accept-Language": "en",
    "Content-Type": "application/json",
    "User-Agent": "playground/1",
  });
});

test("redirectHopHeaders passes same-origin hops through untouched", () => {
  const headers = {
    authorization: "Bearer sk-123",
    cookie: "session=abc",
    "x-api-key": "k1",
    accept: "*/*",
  };
  const out = redirectHopHeaders(
    "https://api.example.com",
    "https://api.example.com",
    headers,
  );
  assert.equal(out, headers);
});

test("redirectHopHeaders allowlists cross-origin hops", () => {
  const out = redirectHopHeaders(
    "https://api.example.com",
    "https://other.example.com",
    {
      authorization: "Bearer sk-123",
      cookie: "session=abc",
      "x-api-key": "k1",
      accept: "*/*",
      "content-type": "application/json",
    },
  );
  assert.deepEqual(out, {
    accept: "*/*",
    "content-type": "application/json",
  });
});

test("redirectHopHeaders treats http to https on the same host as cross-origin", () => {
  const out = redirectHopHeaders(
    "http://api.example.com",
    "https://api.example.com",
    {
      authorization: "Bearer sk-123",
      cookie: "session=abc",
      "x-api-key": "k1",
      accept: "*/*",
    },
  );
  assert.deepEqual(out, {
    accept: "*/*",
  });
});

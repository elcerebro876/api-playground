import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPrivateIpv4,
  isPrivateIpv6,
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
  ];
  for (const ip of blocked) assert.equal(isPrivateIpv6(ip), true, ip);
  const publicIps = [
    "2606:4700:1111::1111",
    "2001:4860:4860::8888",
    "::ffff:808:808",
    "64:ff9b::7f00:1",
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

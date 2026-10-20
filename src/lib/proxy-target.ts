import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPrivateIpv4, isPrivateIpv6 } from "./proxy-hardening";

export class ProxyBlockedError extends Error {
  readonly source = "proxy";
  constructor(message: string, readonly code: string) {
    super(message);
  }
}

export async function assertSafeTarget(currentUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(currentUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https targets are allowed");
  }
  if (!parsed.hostname) throw new Error("Missing host");
  if (parsed.port !== "" && parsed.port !== "80" && parsed.port !== "443") {
    throw new ProxyBlockedError("Blocked port", "blocked_port");
  }
  const ipVersion = isIP(parsed.hostname);
  if (ipVersion === 4) {
    if (isPrivateIpv4(parsed.hostname)) throw new Error("Blocked target");
    return parsed;
  }
  if (ipVersion === 6) {
    if (isPrivateIpv6(parsed.hostname)) throw new Error("Blocked target");
    return parsed;
  }
  const addrs = await lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addrs.length) throw new Error("Could not resolve host");
  for (const { address, family } of addrs) {
    const blocked =
      family === 4 ? isPrivateIpv4(address) : isPrivateIpv6(address);
    if (blocked) throw new Error("Blocked target");
  }
  return parsed;
}

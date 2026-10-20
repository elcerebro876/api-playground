import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPrivateIpv4, isPrivateIpv6 } from "./proxy-hardening";
import { ProxyError } from "./proxy-errors";

export async function assertSafeTarget(currentUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(currentUrl);
  } catch {
    throw new ProxyError("bad_url");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ProxyError("bad_url");
  }
  if (!parsed.hostname) throw new ProxyError("bad_url");
  if (parsed.port !== "" && parsed.port !== "80" && parsed.port !== "443") {
    throw new ProxyError("blocked_port");
  }
  const ipVersion = isIP(parsed.hostname);
  if (ipVersion === 4) {
    if (isPrivateIpv4(parsed.hostname)) throw new ProxyError("blocked_target");
    return parsed;
  }
  if (ipVersion === 6) {
    if (isPrivateIpv6(parsed.hostname)) throw new ProxyError("blocked_target");
    return parsed;
  }
  const addrs = await lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addrs.length) throw new ProxyError("upstream_failed");
  for (const { address, family } of addrs) {
    const blocked =
      family === 4 ? isPrivateIpv4(address) : isPrivateIpv6(address);
    if (blocked) throw new ProxyError("blocked_target");
  }
  return parsed;
}

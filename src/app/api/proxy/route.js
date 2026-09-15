import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const ALLOWED_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);
const TIMEOUT_MS = 20000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 8 * 1024 * 1024;

// IPv4 ranges that must never be reachable from the server: loopback,
// private, link-local (incl. 169.254.169.254 cloud metadata), CGNAT,
// and TEST-NET documentation ranges.
const V4_RANGES = [
  [0x00000000, 8], // 0.0.0.0/8
  [0x0a000000, 8], // 10.0.0.0/8
  [0x64400000, 10], // 100.64.0.0/10
  [0x7f000000, 8], // 127.0.0.0/8
  [0xa9fe0000, 16], // 169.254.0.0/16
  [0xac100000, 12], // 172.16.0.0/12
  [0xc0000200, 24], // 192.0.2.0/24
  [0xc0a80000, 16], // 192.168.0.0/16
  [0xc6120000, 15], // 198.18.0.0/15
  [0xc6336400, 24], // 198.51.100.0/24
  [0xcb007100, 24], // 203.0.113.0/24
];

function ipToInt(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
  }
  return (
    (((Number(parts[0]) << 24) |
      (Number(parts[1]) << 16) |
      (Number(parts[2]) << 8) |
      Number(parts[3])) >>>
      0)
  );
}

function isPrivateIpv4(ip) {
  const int = ipToInt(ip);
  if (int === null) return false;
  return V4_RANGES.some(([start, len]) => {
    const mask = len === 0 ? 0 : (~0 << (32 - len)) >>> 0;
    return (int & mask) === (start & mask);
  });
}

function isPrivateIpv6(ip) {
  const lower = ip.toLowerCase();
  // IPv4-mapped addresses such as ::ffff:127.0.0.1 or ::127.0.0.1
  const mapped = lower.match(/^::(?:ffff:)?((?:\d{1,3}\.){3}\d{1,3})$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
  const first = lower.split(":")[0];
  return /^fe[89ab]/.test(first); // fe80::/10
}

async function assertSafeTarget(currentUrl) {
  let parsed;
  try {
    parsed = new URL(currentUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https targets are allowed");
  }
  if (!parsed.hostname) throw new Error("Missing host");
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

export async function POST(request) {
  const start = Date.now();
  try {
    const { method, url, headers, body } = await request.json();
    const m = String(method || "GET").toUpperCase();
    if (!ALLOWED_METHODS.has(m)) throw new Error("Method not allowed");
    if (typeof url !== "string" || !url.trim()) throw new Error("Missing url");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      let target = url.trim();
      const fetchOpts = {
        method: m,
        headers: headers || undefined,
        body: body || undefined,
        signal: controller.signal,
        redirect: "manual",
      };
      let res;
      for (let hop = 0; ; hop++) {
        const parsed = await assertSafeTarget(target);
        res = await fetch(parsed.toString(), fetchOpts);
        const location = res.headers.get("location");
        if (res.status >= 300 && res.status < 400 && location) {
          if (hop >= MAX_REDIRECTS) throw new Error("Too many redirects");
          target = new URL(location, parsed).toString();
          if (res.status === 303 || (res.status !== 307 && res.status !== 308)) {
            // Mirrors fetch "follow" semantics for 301/302/303.
            fetchOpts.method = "GET";
            fetchOpts.body = undefined;
          }
          continue;
        }
        break;
      }

      const headerEntries = Object.fromEntries(res.headers.entries());
      const contentType = headerEntries["content-type"] || "";
      const chunks = [];
      let totalBytes = 0;
      let truncated = false;
      if (res.body) {
        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (totalBytes + value.byteLength > MAX_BODY_BYTES) {
            chunks.push(value.subarray(0, MAX_BODY_BYTES - totalBytes));
            truncated = true;
            await reader.cancel();
            break;
          }
          chunks.push(value);
          totalBytes += value.byteLength;
        }
      }
      const raw = Buffer.concat(chunks);
      // Treat payloads that cannot round-trip through UTF-8 text as binary and
      // return them base64-encoded instead of corrupting them via TextDecoder.
      const isBinary =
        !/svg\+xml/.test(contentType) &&
        (/^(image|audio|video|font|model)\//.test(contentType) ||
          /multipart\//.test(contentType) ||
          /application\/(?:octet-stream|zip|gzip|pdf|wasm|msgpack|protobuf|binary|vnd\.|x-7z)/i.test(
            contentType,
          ) ||
          raw.subarray(0, 512).includes(0x00));
      let resBody;
      if (isBinary) {
        resBody = raw.toString("base64");
      } else {
        const charsetMatch = contentType.match(/charset=([^;]+)/i);
        const charset = (charsetMatch?.[1] || "utf-8").replace(/["']/g, "").trim();
        let label = "utf-8";
        try {
          new TextDecoder(charset);
          label = charset;
        } catch {
          /* unsupported label — keep utf-8 */
        }
        resBody = new TextDecoder(label, { fatal: false }).decode(raw);
        if (truncated) resBody += "\n[response truncated at 8MB]";
      }

      const elapsed = Date.now() - start;
      return Response.json({
        status: res.status,
        ok: res.ok,
        time: elapsed,
        headers: headerEntries,
        body: resBody,
        truncated,
        ...(isBinary ? { isBinary: true, encoding: "base64" } : {}),
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    const elapsed = Date.now() - start;
    return Response.json(
      {
        error: e?.name === "AbortError" ? "Upstream timed out" : (e?.message || "Proxy error"),
        time: elapsed,
      },
      { status: 500 },
    );
  }
}
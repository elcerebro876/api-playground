import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Agent, fetch as undiciFetch } from "undici";
import * as httpMethods from "../../../lib/http-methods";
import { clientIp, hashKey, rateLimit } from "../../../lib/rate-limit";
import {
  isPrivateIpv4,
  isPrivateIpv6,
  withoutSensitiveHeaders,
} from "../../../lib/proxy-hardening";

const ALLOWED_METHODS = new Set(httpMethods.ALLOWED_METHODS);
const TIMEOUT_MS = 20000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const PROXY_BURST_MAX = 60;
const PROXY_BURST_WINDOW_SECS = 10 * 60;
const PROXY_DAILY_MAX = 400;

// Connection-time DNS lookup for the outbound Agent. `assertSafeTarget`
// validates one resolution, but a rebinding host can answer differently when
// the socket actually connects (TOCTOU). Re-resolve here and hand back only
// addresses that pass the same private-range checks, so the socket can never
// be pinned to a blocked address.
function safeLookup(hostname, options, callback) {
  lookup(hostname, { all: true, verbatim: true })
    .then((addrs) => {
      const safe = addrs.filter(({ address, family }) =>
        family === 4 ? !isPrivateIpv4(address) : !isPrivateIpv6(address),
      );
      if (!safe.length) {
        callback(new Error("Blocked target"));
        return;
      }
      if (options && options.all) {
        callback(
          null,
          safe.map(({ address, family }) => ({ address, family })),
        );
      } else {
        callback(null, safe[0].address, safe[0].family);
      }
    })
    .catch((err) => callback(err));
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
  const rl = await rateLimit(await hashKey("proxy", clientIp(request)), {
    burstMax: PROXY_BURST_MAX,
    burstWindowSecs: PROXY_BURST_WINDOW_SECS,
    dailyMax: PROXY_DAILY_MAX,
  });
  if (!rl.ok) {
    const time = Date.now() - start;
    if ("retryAfter" in rl) {
      return Response.json(
        { error: "Too many proxy requests, try again later", time },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }
    return Response.json(
      {
        error: "Proxy is temporarily unavailable. Please try again later.",
        time,
      },
      { status: 503 },
    );
  }
  try {
    const { method, url, headers, body } = await request.json();
    const m = String(method || "GET").toUpperCase();
    if (!ALLOWED_METHODS.has(m)) throw new Error("Method not allowed");
    if (typeof url !== "string" || !url.trim()) throw new Error("Missing url");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    // Pin every connection to a freshly re-validated DNS answer (see safeLookup).
    const agent = new Agent({ connect: { lookup: safeLookup } });
    try {
      let target = url.trim();
      const fetchOpts = {
        method: m,
        headers: headers || undefined,
        body: body || undefined,
        signal: controller.signal,
        redirect: "manual",
        dispatcher: agent,
      };
      let res;
      let prevOrigin = null;
      for (let hop = 0; ; hop++) {
        const parsed = await assertSafeTarget(target);
        const sentHeaders = fetchOpts.headers;
        if (
          prevOrigin !== null &&
          prevOrigin !== parsed.origin &&
          sentHeaders &&
          typeof sentHeaders === "object" &&
          !Array.isArray(sentHeaders)
        ) {
          fetchOpts.headers = withoutSensitiveHeaders(sentHeaders);
        }
        prevOrigin = parsed.origin;
        res = await undiciFetch(parsed.toString(), fetchOpts);
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
      agent.destroy();
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
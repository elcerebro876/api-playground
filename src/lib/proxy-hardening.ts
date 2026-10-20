const V4_RANGES: Array<[number, number]> = [
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

export function ipToInt(ip: string): number | null {
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

export function isPrivateIpv4(ip: string): boolean {
  const int = ipToInt(ip);
  if (int === null) return false;
  return V4_RANGES.some(([start, len]) => {
    const mask = len === 0 ? 0 : (~0 << (32 - len)) >>> 0;
    return (int & mask) === (start & mask);
  });
}

function expandIpv6(ip: string): number[] | null {
  let s = ip.toLowerCase();
  const pct = s.indexOf("%");
  if (pct !== -1) s = s.slice(0, pct);
  const v4 = s.match(/:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4) {
    const int = ipToInt(v4[1]);
    if (int === null) return null;
    const at = v4.index ?? 0;
    const hi = ((int >>> 16) & 0xffff).toString(16);
    const lo = (int & 0xffff).toString(16);
    s = `${s.slice(0, at)}:${hi}:${lo}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = 8 - left.length - right.length;
  if (halves.length === 1 ? fill !== 0 : fill < 1) return null;
  const groups: number[] = [];
  for (const g of [...left, ...new Array<string>(fill).fill("0"), ...right]) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    groups.push(parseInt(g, 16));
  }
  return groups;
}

export function isPrivateIpv6(ip: string): boolean {
  const groups = expandIpv6(ip);
  if (!groups) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::(?:ffff:)?((?:\d{1,3}\.){3}\d{1,3})$/);
    if (mapped) return isPrivateIpv4(mapped[1]);
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      /^fe[89ab]/.test(lower.split(":")[0])
    );
  }
  if (
    groups.slice(0, 5).every((g) => g === 0) &&
    (groups[5] === 0 || groups[5] === 0xffff)
  ) {
    return isPrivateIpv4(
      `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`,
    );
  }
  if (groups[0] === 0x64 && groups[1] === 0xff9b) {
    if (groups[2] === 0 && groups.slice(3, 6).every((g) => g === 0)) return true;
    if (groups[2] === 1) return true;
  }
  if (groups[0] === 0x2002) return true;
  if (groups[0] === 0x2001 && groups[1] === 0) return true;
  if ((groups[0] & 0xfe00) === 0xfc00) return true;
  if ((groups[0] & 0xffc0) === 0xfe80) return true;
  return false;
}

export function isSensitiveHeader(name: string): boolean {
  const n = name.toLowerCase();
  if (n === "cookie" || n === "authorization" || n === "proxy-authorization") {
    return true;
  }
  return /(?:^|[-_])(?:api[-_]?key|key|token|secret|password|passwd|auth|session|signature|bearer)(?:$|[-_])/.test(
    n,
  );
}

export function withoutSensitiveHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (!isSensitiveHeader(k)) out[k] = v;
  }
  return out;
}

const CROSS_ORIGIN_HEADER_ALLOWLIST = new Set([
  "accept",
  "accept-language",
  "content-type",
  "user-agent",
]);

export function restrictCrossOriginHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (CROSS_ORIGIN_HEADER_ALLOWLIST.has(k.toLowerCase())) out[k] = v;
  }
  return out;
}

export function redirectHopHeaders(
  prevOrigin: string | null,
  nextOrigin: string,
  headers: Record<string, string>,
): Record<string, string> {
  if (prevOrigin === null || prevOrigin === nextOrigin) return headers;
  return restrictCrossOriginHeaders(headers);
}

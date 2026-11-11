// Parses the subset of curl commands the Explorer can replay. Arguments that
// only affect curl itself (output files, TLS checks, cookies) are reported as
// skipped instead of being silently dropped.

export type CurlImport = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  skippedCookies: boolean;
  skippedInsecure: boolean;
};

export type CurlParseFailure =
  | "empty"
  | "multiple"
  | "no_url"
  | "bad_quote"
  | "unsupported";

export type CurlParseResult =
  | { ok: true; value: CurlImport }
  | { ok: false; reason: CurlParseFailure };

export function looksLikeCurlCommand(input: string): boolean {
  return /^\s*curl(?:\s|$)/i.test(input);
}

export function curlHeader(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const lower = name.toLowerCase();
  const hit = Object.entries(headers).find(([key]) => key.toLowerCase() === lower);
  return hit?.[1];
}

function splitCommands(input: string): string[] {
  // A backslash-newline is a continuation of the same command.
  const text = input.replace(/\\\r?\n/g, " ");
  const commands: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      current += ch;
      if (ch === quote && text[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    const pair = text.slice(i, i + 2);
    if (ch === ";" || ch === "\n" || pair === "&&" || pair === "||") {
      if (pair === "&&" || pair === "||") i += 1;
      if (current.trim()) commands.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) commands.push(current.trim());
  return commands;
}

function tokenize(command: string): string[] | null {
  const tokens: string[] = [];
  let token = "";
  let quote: '"' | "'" | null = null;
  let started = false;
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      else token += ch;
      started = true;
      continue;
    }
    if (quote === '"') {
      if (ch === "\\" && i + 1 < command.length) {
        const next = command[i + 1];
        if (next === '"' || next === "\\") {
          token += next;
          i += 1;
        } else {
          token += ch;
        }
      } else if (ch === '"') {
        quote = null;
      } else {
        token += ch;
      }
      started = true;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
      continue;
    }
    if (ch === "\\" && i + 1 < command.length) {
      token += command[i + 1];
      i += 1;
      started = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (started) {
        tokens.push(token);
        token = "";
        started = false;
      }
      continue;
    }
    token += ch;
    started = true;
  }
  if (quote) return null;
  if (started) tokens.push(token);
  return tokens;
}

function base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function addHeader(headers: Record<string, string>, raw: string) {
  const colon = raw.indexOf(":");
  if (colon <= 0) return;
  const name = raw.slice(0, colon).trim();
  const value = raw.slice(colon + 1).trim();
  if (name) headers[name] = value;
}

const ARGLESS_FLAGS = new Set([
  "-s",
  "--silent",
  "-S",
  "--show-error",
  "-L",
  "--location",
  "-i",
  "--include",
  "-v",
  "--verbose",
  "-f",
  "--fail",
  "-N",
  "--no-buffer",
  "-g",
  "--globoff",
  "--compressed",
  "--no-progress-meter",
]);

export function parseCurlCommand(input: string): CurlParseResult {
  const commands = splitCommands(input);
  if (!commands.length) return { ok: false, reason: "empty" };
  if (commands.length > 1) return { ok: false, reason: "multiple" };
  const tokens = tokenize(commands[0]);
  if (!tokens || !tokens.length) return { ok: false, reason: "bad_quote" };
  if (tokens[0].toLowerCase() !== "curl") {
    return { ok: false, reason: "no_url" };
  }

  let method = "";
  let url = "";
  let hasBody = false;
  let jsonBody = false;
  const bodyParts: string[] = [];
  const headers: Record<string, string> = {};
  let skippedCookies = false;
  let skippedInsecure = false;

  for (let i = 1; i < tokens.length; i++) {
    let token = tokens[i];
    let inline: string | null = null;
    if (token.startsWith("--") && token.includes("=")) {
      const eq = token.indexOf("=");
      inline = token.slice(eq + 1);
      token = token.slice(0, eq);
    }
    const take = (): string | null => {
      if (inline !== null) return inline;
      if (i + 1 >= tokens.length) return null;
      i += 1;
      return tokens[i];
    };

    if (!token.startsWith("-") || token === "-") {
      if (!url) url = token;
      continue;
    }

    switch (token) {
      case "-X":
      case "--request": {
        const value = take();
        if (!value) return { ok: false, reason: "unsupported" };
        method = value.toUpperCase();
        break;
      }
      case "-H":
      case "--header": {
        const value = take();
        if (!value) return { ok: false, reason: "unsupported" };
        addHeader(headers, value);
        break;
      }
      case "-d":
      case "--data":
      case "--data-raw":
      case "--data-binary":
      case "--data-urlencode": {
        const value = take();
        if (value === null) return { ok: false, reason: "unsupported" };
        if (value.startsWith("@")) return { ok: false, reason: "unsupported" };
        bodyParts.push(value);
        hasBody = true;
        break;
      }
      case "--json": {
        const value = take();
        if (value === null) return { ok: false, reason: "unsupported" };
        if (value.startsWith("@")) return { ok: false, reason: "unsupported" };
        bodyParts.push(value);
        hasBody = true;
        jsonBody = true;
        headers["Content-Type"] = "application/json";
        break;
      }
      case "-u":
      case "--user": {
        const value = take();
        if (value === null) return { ok: false, reason: "unsupported" };
        headers.Authorization = `Basic ${base64(value)}`;
        break;
      }
      case "-b":
      case "--cookie": {
        skippedCookies = true;
        if (inline === null && i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
          i += 1;
        }
        break;
      }
      case "-k":
      case "--insecure":
        skippedInsecure = true;
        break;
      case "-A":
      case "--user-agent": {
        const value = take();
        if (value) headers["User-Agent"] = value;
        break;
      }
      case "-e":
      case "--referer": {
        const value = take();
        if (value) headers.Referer = value;
        break;
      }
      case "--url": {
        const value = take();
        if (value) url = value;
        break;
      }
      case "-I":
      case "--head":
        method = "HEAD";
        break;
      case "-o":
      case "--output":
      case "--connect-timeout":
      case "--max-time":
        take();
        break;
      default:
        if (ARGLESS_FLAGS.has(token)) break;
        // Unknown flag: consume a value when one is attached, otherwise leave
        // the next token alone if it looks like a URL or another flag.
        if (inline === null && i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
          i += 1;
        }
        break;
    }
  }

  if (!url) return { ok: false, reason: "no_url" };
  if (!method) method = hasBody || jsonBody ? "POST" : "GET";

  return {
    ok: true,
    value: {
      method,
      url,
      headers,
      body: bodyParts.length ? bodyParts.join("&") : null,
      skippedCookies,
      skippedInsecure,
    },
  };
}

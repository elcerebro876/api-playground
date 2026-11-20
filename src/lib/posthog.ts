import posthog from "posthog-js";

const INTERNAL_STORAGE_KEY = "api-playground-internal";
const REF_STORAGE_KEY = "api-playground-ref";
const REF_MAX_LENGTH = 64;

let initialized = false;

function readStorage(storage: "local" | "session", key: string): string | null {
  try {
    return (storage === "local" ? window.localStorage : window.sessionStorage).getItem(
      key,
    );
  } catch {
    return null;
  }
}

function writeStorage(
  storage: "local" | "session",
  key: string,
  value: string | null,
): void {
  try {
    if (value === null) {
      (storage === "local"
        ? window.localStorage
        : window.sessionStorage
      ).removeItem(key);
    } else {
      (storage === "local"
        ? window.localStorage
        : window.sessionStorage
      ).setItem(key, value);
    }
  } catch {
    // Storage can be blocked (private mode, quota). Analytics must not break.
  }
}

function readInternalFlag(): boolean {
  return readStorage("local", INTERNAL_STORAGE_KEY) === "1";
}

function readRef(): string | null {
  return readStorage("session", REF_STORAGE_KEY);
}

function applyUrlFlags(): { clearInternal: boolean } {
  try {
    const params = new URLSearchParams(window.location.search);
    const internal = params.get("internal");
    if (internal === "1") {
      writeStorage("local", INTERNAL_STORAGE_KEY, "1");
    } else if (internal === "0") {
      writeStorage("local", INTERNAL_STORAGE_KEY, null);
    }

    const ref = params.get("ref")?.trim();
    if (ref) {
      writeStorage("session", REF_STORAGE_KEY, ref.slice(0, REF_MAX_LENGTH));
    }
    return { clearInternal: internal === "0" };
  } catch {
    return { clearInternal: false };
  }
}

function stripQueryAndHash(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/)[0];
  }
}

// Automatic context properties carry the full page URL. The page URL can hold
// the `ref`/`internal` flags (and anything else an integration appended), so
// trim query strings and hashes before PostHog sends them.
function sanitizeProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of [
    "$current_url",
    "$session_entry_url",
    "$referrer",
    "$initial_referrer",
  ]) {
    const value = properties[key];
    if (typeof value === "string" && value) {
      properties[key] = stripQueryAndHash(value);
    }
  }
  return properties;
}

function capture(
  name: string,
  properties: Record<string, unknown>,
): void {
  if (!initialized || typeof window === "undefined") return;
  try {
    posthog.capture(name, properties);
  } catch {
    // Analytics failures must never break the app.
  }
}

export function initPostHog(): void {
  if (typeof window === "undefined" || initialized) return;
  const { clearInternal } = applyUrlFlags();
  const key =
    process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!key) return;
  try {
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      autocapture: false,
      defaults: "2026-05-30",
      sanitize_properties: sanitizeProperties,
    });
  } catch {
    return;
  }
  try {
    if (clearInternal || !readInternalFlag()) {
      posthog.unregister("internal");
    } else {
      posthog.register({ internal: true });
    }
    const ref = readRef();
    if (ref) {
      posthog.register({ ref });
    } else {
      posthog.unregister("ref");
    }
  } catch {
    // Super properties are best-effort.
  }
  initialized = true;
}

export function trackToolUsed(details: {
  method: string;
  host: string;
}): void {
  capture("playground_tool_used", details);
}

export type RequestSource = "manual" | "discover" | "import" | "history";
export type StatusClass = "2xx" | "3xx" | "4xx" | "5xx" | "network_error";
export type LandingCta = "hero" | "final" | "sample_api";

export type AnalyticsEvent =
  | {
      name: "request_sent";
      properties: {
        method: string;
        source: RequestSource;
        has_body: boolean;
      };
    }
  | {
      name: "response_received";
      properties: {
        status_class: StatusClass;
        duration_ms: number;
        content_type: string;
      };
    }
  | {
      name: "explain_started";
      properties: {
        credentialed: boolean;
        truncated: boolean;
        has_candidates: boolean;
      };
    }
  | {
      name: "explain_completed";
      properties: {
        from_cache: boolean;
        cached: boolean;
        latency_ms: number;
        candidate_count: number;
      };
    }
  | {
      name: "explain_failed";
      properties: { reason: string };
    }
  | {
      name: "try_next_clicked";
      properties: {
        source: "pagination" | "url-field" | "id";
        position: number;
      };
    }
  | {
      name: "explain_cap_reached";
      properties: { scope: "ip" | "global" };
    }
  | {
      name: "explain_saved";
      properties: { method: string; status?: number };
    }
  | {
      name: "explain_unsaved";
      properties: { method: string; status?: number };
    }
  | {
      name: "error_coach_shown";
      properties: { error_type: string };
    }
  | {
      name: "urlfix_applied";
      properties: { error_type: string };
    }
  | {
      name: "urlfix_sent";
      properties: { status_class: StatusClass };
    }
  | {
      name: "discover_api_opened";
      properties: { api_id: string };
    }
  | {
      name: "discover_example_used";
      properties: { api_id: string };
    }
  | {
      name: "import_started";
      properties: Record<string, never>;
    }
  | {
      name: "import_completed";
      properties: { request_count: number };
    }
  | {
      name: "import_failed";
      properties: { reason: string };
    }
  | {
      name: "landing_cta_clicked";
      properties: { which: LandingCta };
    };

export function track(event: AnalyticsEvent): void {
  capture(event.name, event.properties);
}

export function curatedApiId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function statusClassOf(status: unknown): StatusClass {
  if (typeof status !== "number" || !Number.isFinite(status)) {
    return "network_error";
  }
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  if (status >= 300) return "3xx";
  return "2xx";
}

export function contentTypeOf(
  headers?: Record<string, string> | null,
): string {
  if (!headers) return "unknown";
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === "content-type",
  );
  const raw = entry?.[1];
  if (!raw) return "unknown";
  return raw.split(";")[0]?.trim().toLowerCase() || "unknown";
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

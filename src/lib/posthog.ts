import posthog from "posthog-js";

let initialized = false;

export function initPostHog(): void {
  if (typeof window === "undefined" || initialized) return;
  const key =
    process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!key) return;
  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    autocapture: false,
    defaults: "2026-05-30",
  });
  initialized = true;
}

export function trackToolUsed(details: { method: string; url: string }): void {
  if (!initialized || typeof window === "undefined") return;
  posthog.capture("playground_tool_used", details);
}

export type AnalyticsEvent =
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
        latency_ms: number;
        candidate_count: number;
      };
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
    };

export function track(event: AnalyticsEvent): void {
  if (!initialized || typeof window === "undefined") return;
  posthog.capture(event.name, event.properties);
}
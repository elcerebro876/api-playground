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
    autocapture: true,
    defaults: "2026-05-30",
  });
  initialized = true;
}

export function trackToolUsed(details: { method: string; url: string }): void {
  if (!initialized || typeof window === "undefined") return;
  posthog.capture("playground_tool_used", details);
}
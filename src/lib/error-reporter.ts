import type { PostHog } from "posthog-node";

// Report server-side errors to PostHog error tracking. Best-effort: never
// throws, and is a no-op when PostHog is not configured. posthog-node is
// imported lazily so the Edge build never pulls a Node-only dependency.

type ServerErrorProperties = Record<string, string | number | boolean>;

const CAPTURE_TIMEOUT_MS = 2000;

let clientPromise: Promise<PostHog | null> | null = null;

function resolveConfig(): { key: string; host: string } | null {
  const key =
    process.env.POSTHOG_API_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!key) return null;
  return {
    key,
    host:
      process.env.POSTHOG_HOST ||
      process.env.NEXT_PUBLIC_POSTHOG_HOST ||
      "https://us.i.posthog.com",
  };
}

function getClient(): Promise<PostHog | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const config = resolveConfig();
      if (!config) return null;
      const { PostHog } = await import("posthog-node");
      return new PostHog(config.key, { host: config.host });
    })();
  }
  return clientPromise;
}

export async function captureServerError(
  error: unknown,
  properties: ServerErrorProperties = {},
): Promise<void> {
  try {
    const client = await getClient();
    if (!client) return;
    await Promise.race([
      client.captureExceptionImmediate(error, "server", properties),
      new Promise((resolve) => setTimeout(resolve, CAPTURE_TIMEOUT_MS)),
    ]);
  } catch {
    // Monitoring must never break or slow the request path.
  }
}

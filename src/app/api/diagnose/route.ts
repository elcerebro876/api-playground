import {
  generateDiagnosis,
  maskHeaders,
  maskSensitiveStrings,
  maskUrlSecrets,
  type DiagnosisInput,
} from "@/lib/diagnose";
import { isAIConfigured } from "@/lib/ai";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  return Response.json({ configured: isAIConfigured() });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = await rateLimit(`diagnose:${ip}`);
  if (!rl.ok) {
    return Response.json(
      { error: "Too many requests, try again later" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let payload: {
    method?: string;
    url?: string;
    requestHeaders?: Record<string, string>;
    status?: number | null;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const method = (payload.method ?? "GET").trim().toUpperCase().slice(0, 10);
  const url = (payload.url ?? "").trim().slice(0, 500);
  if (!url) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  if (!isAIConfigured()) {
    return Response.json(
      {
        error:
          "AI diagnosis is not configured yet. Add CEREBRAS_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY to enable it.",
      },
      { status: 503 },
    );
  }

  // Defense in depth: re-mask on the server even though the client already masks.
  const input: DiagnosisInput = {
    method,
    url: maskUrlSecrets(url),
    requestHeaders: maskHeaders(payload.requestHeaders ?? {}),
    status: typeof payload.status === "number" ? payload.status : null,
    responseHeaders: maskHeaders(payload.responseHeaders ?? {}),
    responseBody: maskSensitiveStrings((payload.responseBody ?? "").slice(0, 6000)),
  };

  try {
    const result = await generateDiagnosis(input);
    return Response.json(result);
  } catch (e) {
    console.error("[diagnose] failed", (e as Error)?.message);
    return Response.json(
      { error: "Couldn't diagnose this request, try again" },
      { status: 500 },
    );
  }
}
import { getSupabase, type ExplainRecord } from "@/lib/supabase";
import { generateExplanation, isGeminiConfigured } from "@/lib/explain";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Cheap deterministic signature of the request so cached explanations are not
// reused across requests that produced different responses (e.g. different
// status codes or response bodies for the same URL).
function requestSignature(responseBody: string): string {
  const sample = responseBody.slice(0, 4000);
  let h = 5381;
  for (let i = 0; i < sample.length; i++) {
    h = ((h << 5) + h + sample.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`explain:${ip}`);
  if (!rl.ok) {
    return Response.json(
      { error: "Too many requests, try again later" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let payload: {
    url?: string;
    apiName?: string;
    status?: number;
    body?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const endpointUrl = (payload.url ?? "").trim().slice(0, 500);
  const apiName = (payload.apiName ?? "API").trim().slice(0, 100);
  const status = payload.status ?? 0;
  const responseBody = payload.body ?? "";

  if (!endpointUrl) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  // Scope the cache to URL + status + a short body signature so one request's
  // response-grounded explanation is never served for a materially different one.
  const cacheKey = `${endpointUrl}\u0000${status}\u0000${requestSignature(responseBody)}`;

  const client = getSupabase();

  if (client) {
    try {
      const { data, error } = await client
        .from("explanations")
        .select("*")
        .eq("endpoint_url", cacheKey)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        await client
          .from("explanations")
          .update({
            call_count: (data.call_count ?? 1) + 1,
            last_requested_at: new Date().toISOString(),
          })
          .eq("id", data.id);
        return Response.json({ ...data, fromCache: true });
      }
    } catch {
      // DB query failed: fall through to Gemini rather than failing outright.
    }
  }

  if (!isGeminiConfigured()) {
    return Response.json(
      {
        error:
          "AI explanation is not configured yet. Add GEMINI_API_KEY and a Supabase project to enable it.",
      },
      { status: 503 },
    );
  }

  let explanation;
  try {
    explanation = await generateExplanation({
      apiName,
      endpointUrl,
      status,
      responseBody,
    });
  } catch (e) {
    const err = e as Error;
    return Response.json(
      {
        error: err?.message || "Couldn't generate an explanation, try again",
      },
      { status: 500 },
    );
  }

  const record: ExplainRecord = {
    endpoint_url: cacheKey,
    api_name: apiName,
    target_users: explanation.target_users,
    problem_solved: explanation.problem_solved,
    request_action: explanation.request_action,
    expected_outcome: explanation.expected_outcome,
    build_idea: explanation.build_idea,
    call_count: 1,
  };

  if (client) {
    try {
      await client.from("explanations").insert(record);
    } catch {
      // Caching is best-effort; the explanation is still returned.
    }
  }

  return Response.json(record);
}
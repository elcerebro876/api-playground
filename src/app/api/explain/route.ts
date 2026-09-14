import { getSupabase, type ExplainRecord } from "@/lib/supabase";
import { generateExplanation, isGeminiConfigured } from "@/lib/explain";

export async function POST(request: Request) {
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
  const endpointUrl = (payload.url ?? "").trim();
  const apiName = (payload.apiName ?? "API").trim();
  const status = payload.status ?? 0;
  const responseBody = payload.body ?? "";

  if (!endpointUrl) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  const client = getSupabase();

  if (client) {
    try {
      const { data, error } = await client
        .from("explanations")
        .select("*")
        .eq("endpoint_url", endpointUrl)
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
    endpoint_url: endpointUrl,
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
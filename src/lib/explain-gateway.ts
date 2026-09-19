import type { ExplainPayload } from "@/lib/explain";

// AI Gateway variant of the explainer (model google/gemini-3.6-flash, routed
// through Vercel AI Gateway). DORMANT until the Vercel team has a credit card
// on file (AI Gateway returns 403 "requires a valid credit card..." otherwise).
//
// To re-enable: point route.ts at this module (import generateExplanation,
// isGatewayConfigured from "@/lib/explain-gateway") and swap the guard +
// configured-notice message in src/app/api/explain/route.ts.

const MODEL = "google/gemini-3.6-flash";
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

export function isGatewayConfigured() {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) return false;
  return !key.toLowerCase().includes("your_");
}

export async function generateExplanation(opts: {
  apiName: string;
  endpointUrl: string;
  responseBody: string;
  status: number;
}): Promise<ExplainPayload> {
  const { apiName, endpointUrl, responseBody, status } = opts;
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) return Promise.reject(new Error("AI_GATEWAY_API_KEY not configured"));

  const prompt = [
    'You explain HTTP responses from one API in plain, useful terms.',
    `API: ${apiName}`,
    `Endpoint: ${endpointUrl}`,
    `HTTP status: ${status}`,
    "Response body:",
    responseBody.slice(0, 6000) || "(empty response)",
    "",
    "Return STRICT JSON with exactly these 5 string fields. Each value must be one short sentence (under 40 words):",
    '- target_users: who would realistically use this API/data',
    '- problem_solved: what real problem the endpoint helps solve',
    '- request_action: what the client asked for in this exact request (ground it in the actual request URL/params shown above)',
    '- expected_outcome: what the response indicates happened (ground it in the actual fields returned above)',
    '- build_idea: a concrete app or product idea that could use fields from THIS response',
  ].join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return Promise.reject(
        new Error(`AI Gateway error ${res.status}: ${text.slice(0, 200)}`),
      );
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    if (!text)
      return Promise.reject(new Error("AI Gateway returned empty text"));
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const fields = [
      "target_users",
      "problem_solved",
      "request_action",
      "expected_outcome",
      "build_idea",
    ];
    for (const f of fields) {
      if (typeof parsed?.[f] !== "string" || !parsed[f].trim()) {
        return Promise.reject(new Error(`AI Gateway missing "${f}"`));
      }
    }
    return {
      target_users: parsed.target_users.trim(),
      problem_solved: parsed.problem_solved.trim(),
      request_action: parsed.request_action.trim(),
      expected_outcome: parsed.expected_outcome.trim(),
      build_idea: parsed.build_idea.trim(),
    };
  } catch (e) {
    const err = e as Error;
    const aborted = err?.name === "AbortError";
    return Promise.reject(
      new Error(
        aborted ? "AI Gateway timed out" : err?.message || "AI Gateway failed",
      ),
    );
  } finally {
    clearTimeout(timer);
  }
}
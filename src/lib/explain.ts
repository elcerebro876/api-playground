export type ExplainPayload = {
  target_users: string;
  problem_solved: string;
  request_action: string;
  expected_outcome: string;
  build_idea: string;
};

const MODEL = "gemini-3.6-flash";

export function isGeminiConfigured() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return false;
  return !key.toLowerCase().includes("your_gemini");
}

export async function generateExplanation(opts: {
  apiName: string;
  endpointUrl: string;
  responseBody: string;
  status: number;
}): Promise<ExplainPayload> {
  const { apiName, endpointUrl, responseBody, status } = opts;
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return Promise.reject(new Error("GEMINI_API_KEY not configured"));

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
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      return Promise.reject(
        new Error(`Gemini error ${res.status}: ${text.slice(0, 200)}`),
      );
    }
    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) return Promise.reject(new Error("Gemini returned empty text"));
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
        return Promise.reject(new Error(`Gemini missing "${f}"`));
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
      new Error(aborted ? "Gemini timed out" : err?.message || "Gemini failed"),
    );
  } finally {
    clearTimeout(timer);
  }
}
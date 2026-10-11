import { callAIJson } from "@/lib/ai";

export type ExplainPayload = {
  target_users: string;
  problem_solved: string;
  request_action: string;
  expected_outcome: string;
  build_idea: string;
};

export { isGeminiConfigured } from "@/lib/ai";

export function parseExplanation(text: string): ExplainPayload | null {
  let parsed: Record<string, unknown>;
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  const fields = [
    "target_users",
    "problem_solved",
    "request_action",
    "expected_outcome",
    "build_idea",
  ];
  for (const f of fields) {
    if (typeof parsed?.[f] !== "string" || !(parsed[f] as string).trim()) {
      return null;
    }
  }
  return {
    target_users: (parsed.target_users as string).trim(),
    problem_solved: (parsed.problem_solved as string).trim(),
    request_action: (parsed.request_action as string).trim(),
    expected_outcome: (parsed.expected_outcome as string).trim(),
    build_idea: (parsed.build_idea as string).trim(),
  };
}

export async function generateExplanation(opts: {
  apiName: string;
  endpointUrl: string;
  responseBody: string;
  status: number;
}): Promise<ExplainPayload> {
  const { apiName, endpointUrl, responseBody, status } = opts;

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

  const text = await callAIJson(prompt, {
    temperature: 0.4,
    timeoutMs: 15000,
    validate: (t) => parseExplanation(t) !== null,
  });

  const parsed = parseExplanation(text);
  if (!parsed) {
    return Promise.reject(new Error("AI returned invalid JSON"));
  }
  return parsed;
}
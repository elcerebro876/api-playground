import { callAIJson } from "@/lib/ai";
import { maskSensitiveStrings, maskUrlSecrets } from "@/lib/diagnose";

export const EXPLAIN_BODY_LIMIT = 6000;

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

// Builds the model prompt with the request URL and response body masked first
// (defense in depth: the route also masks before calling). Only the masked and
// length-capped body ever reaches the provider.
export function buildExplainPrompt(opts: {
  apiName: string;
  endpointUrl: string;
  responseBody: string;
  status: number;
}): string {
  const { apiName, endpointUrl, responseBody, status } = opts;
  const maskedUrl = maskUrlSecrets(endpointUrl);
  const maskedBody = maskSensitiveStrings(responseBody).slice(
    0,
    EXPLAIN_BODY_LIMIT,
  );

  return [
    'You explain HTTP responses from one API in plain, useful terms.',
    `API: ${apiName}`,
    `Endpoint: ${maskedUrl}`,
    `HTTP status: ${status}`,
    "Response body:",
    maskedBody || "(empty response)",
    "",
    "Return STRICT JSON with exactly these 5 string fields. Each value must be one short sentence (under 40 words):",
    '- target_users: who would realistically use this API/data',
    '- problem_solved: what real problem the endpoint helps solve',
    '- request_action: what the client asked for in this exact request (ground it in the actual request URL/params shown above)',
    '- expected_outcome: what the response indicates happened (ground it in the actual fields returned above)',
    '- build_idea: a concrete app or product idea that could use fields from THIS response',
  ].join("\n");
}

export async function generateExplanation(opts: {
  apiName: string;
  endpointUrl: string;
  responseBody: string;
  status: number;
}): Promise<ExplainPayload> {
  const prompt = buildExplainPrompt(opts);

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

export const EXPLAIN_TTL_SECS = 30 * 24 * 60 * 60;
export const EXPLAIN_SECTION_MAX = 300;

export type ExplainSections = {
  who: string;
  what: string;
  build: string;
};

export type ExplainResult = ExplainSections & {
  fromCache: boolean;
  createdAt: string;
  ttlSecs: number;
  truncated: boolean;
};

export type ExplainModelInput = {
  apiName: string;
  method: string;
  endpointUrl: string;
  status: number;
  contentType: string;
  structure: string;
  truncated: boolean;
};

export function trimExplainText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, EXPLAIN_SECTION_MAX);
}

export function parseExplainSections(text: string): ExplainSections | null {
  let parsed: Record<string, unknown>;
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  const fields = ["who", "what", "build"] as const;
  for (const f of fields) {
    if (typeof parsed?.[f] !== "string" || !(parsed[f] as string).trim()) {
      return null;
    }
  }
  return {
    who: trimExplainText(parsed.who as string),
    what: trimExplainText(parsed.what as string),
    build: trimExplainText(parsed.build as string),
  };
}

export function buildExplainSectionsPrompt(
  opts: ExplainModelInput,
): string {
  const maskedUrl = maskUrlSecrets(opts.endpointUrl);
  return [
    "You explain what an API response is for, using only its shape.",
    "You never see response values, only field names and types.",
    `API: ${opts.apiName}`,
    `Request: ${opts.method} ${maskedUrl}`,
    `HTTP status: ${opts.status}`,
    `Content type: ${opts.contentType || "unknown"}`,
    opts.truncated ? "Note: the response body was truncated." : "",
    "Response structure (field paths and leaf types; s=string, n=number, b=boolean, z=null):",
    opts.structure || "(no structure)",
    "",
    "Return STRICT JSON with exactly these 3 string fields. Each value must be one short sentence (under 40 words):",
    "- who: who would realistically use this API/data",
    "- what: what this endpoint does for them, based on the request and response shape",
    "- build: a concrete app or product idea that could use this endpoint",
    "Do not quote or invent specific response values.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function generateExplainSections(
  opts: ExplainModelInput,
): Promise<ExplainSections> {
  const prompt = buildExplainSectionsPrompt(opts);
  const text = await callAIJson(prompt, {
    temperature: 0.4,
    timeoutMs: 15000,
    validate: (t) => parseExplainSections(t) !== null,
  });
  const parsed = parseExplainSections(text);
  if (!parsed) {
    return Promise.reject(new Error("AI returned invalid JSON"));
  }
  return parsed;
}

// Shared AI provider layer for the Explorer section's AI features (Explain and
// Diagnose).
//
// Attempt order (fastest/most reliable first):
//   1. Cerebras (CEREBRAS_API_KEY) direct, rotating through CEREBRAS_MODELS in
//      priority order (429/5xx fail fast, at most 1 timeout).
//   2. Google Gemini (GEMINI_API_KEY), rotating through GEMINI_MODELS in
//      priority order (429/5xx fail fast, at most 1 timeout).
//   3. OpenRouter (OPENROUTER_API_KEY), rotating through a small list of free
//      (:free) models. Defaults to OPENROUTER_MODELS; a single OPENROUTER_MODEL
//      is honored as a one-model alias.
//
// The whole chain runs under a shared wall-clock budget
// (AIJsonOptions.deadlineMs, default 20s): each attempt is clamped to the
// remaining time and the chain stops once it is exhausted, so a slow provider
// can't stall the request for the sum of every provider's timeout.
//
// A lightweight per-provider circuit breaker stops hammering a provider whose
// quota/upstream is exhausted: after AI_BREAKER_THRESHOLD (default 3)
// consecutive provider failures it opens for AI_BREAKER_COOLDOWN_MS (default
// 10 min), skips the provider, then probes once when the cooldown expires. A
// successful call resets the breaker, so providers recover on their own.

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const CEREBRAS_ENDPOINT = "https://api.cerebras.ai/v1/chat/completions";

const DEFAULT_GEMINI_MODELS =
  "gemini-3.6-flash,gemini-3.8-flash,gemini-3.5-flash,gemini-3.1-flash-lite,gemini-flash-latest";

// Free (:free) models have zero per-token cost. Google-served models ride the
// account's prioritized Google AI Studio BYOK key when one is attached (auto
// prioritized by OpenRouter), so they are far more reliable than the shared
// pool. Order matters: first is used first. The 429s return quickly, so a
// throttled pool fails fast to the next candidate instead of burning a full
// timeout.
const DEFAULT_OPENROUTER_MODELS =
  "google/gemma-4-26b-a4b-it:free,google/gemma-4-31b-it:free,cohere/north-mini-code:free,apodex/apodex-1.1-mini:free";

// Reasoning-style models burn tokens on chain-of-thought, so leave headroom
// beyond the ~150 tokens a diagnosis/explanation actually needs.
const OPENROUTER_MAX_TOKENS = 800;

const DEFAULT_CEREBRAS_MODELS = "gpt-oss-120b,qwen-3.8-27b";

export function isGeminiConfigured() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return false;
  return !key.toLowerCase().includes("your_gemini");
}

export function isOpenRouterConfigured() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return false;
  return !key.toLowerCase().includes("your_");
}

export function isCerebrasConfigured() {
  const key = process.env.CEREBRAS_API_KEY?.trim();
  if (!key) return false;
  return !key.toLowerCase().includes("your_");
}

export function isAIConfigured() {
  return (
    isOpenRouterConfigured() || isCerebrasConfigured() || isGeminiConfigured()
  );
}

function geminiModels(): string[] {
  const raw = process.env.GEMINI_MODELS?.trim();
  const source = raw || DEFAULT_GEMINI_MODELS;
  return source
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function openRouterModels(): string[] {
  const raw =
    process.env.OPENROUTER_MODELS?.trim() ||
    process.env.OPENROUTER_MODEL?.trim();
  const source = raw || DEFAULT_OPENROUTER_MODELS;
  return source
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function cerebrasModels(): string[] {
  const raw = process.env.CEREBRAS_MODELS?.trim();
  const source = raw || DEFAULT_CEREBRAS_MODELS;
  return source
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type AIJsonOptions = {
  temperature?: number;
  timeoutMs?: number;
  // Overall wall-clock budget for the whole provider chain (ms). Each provider
  // attempt is clamped to the remaining budget, and once it is exhausted the
  // chain stops and rejects, so the caller can fall back in seconds instead of
  // waiting for every provider's full timeout to expire in sequence.
  deadlineMs?: number;
  // When provided, a provider's reply counts as a failure (and the chain moves
  // to the next provider) if it does not satisfy this predicate. Used to fail
  // over on unusable output (e.g. non-JSON) rather than only transport errors.
  validate?: (text: string) => boolean;
};

// Per-attempt timeout passed to each provider call, plus the absolute deadline
// shared across the whole chain.
type ResolvedCallOpts = {
  temperature: number;
  timeoutMs: number;
  deadline: number;
};

// A single timed-out attempt is enough to abandon a provider for this request:
// retrying the next model can double the wait without improving the odds much.
const MAX_TIMEOUTS_PER_PROVIDER = 1;

// Cerebras can spend a few seconds warming up, but the old 25s floor let one
// stalled provider consume the entire cross-provider budget on its own.
const CEREBRAS_MIN_TIMEOUT_MS = 8_000;

type BreakerState = { failures: number; openUntil: number };

// In-memory per-provider circuit breakers. Like the route rate limiter, state
// lives in the process and resets on restart/deploy.
const breakers = new Map<string, BreakerState>();

function breakerThreshold(): number {
  const n = Number(process.env.AI_BREAKER_THRESHOLD);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 3;
}

function breakerCooldownMs(): number {
  const n = Number(process.env.AI_BREAKER_COOLDOWN_MS);
  return Number.isFinite(n) && n >= 1000 ? Math.floor(n) : 600_000;
}

function breakerAllows(provider: string): boolean {
  const b = breakers.get(provider);
  return !b || b.openUntil <= Date.now();
}

function breakerRecordFailure(provider: string) {
  const now = Date.now();
  const b = breakers.get(provider);
  if (b && b.openUntil > now) return; // already open, nothing to do
  const failures = (b ? b.failures : 0) + 1;
  if (failures >= breakerThreshold()) {
    const cooldown = breakerCooldownMs();
    breakers.set(provider, { failures, openUntil: now + cooldown });
    console.warn(
      `[ai] ${provider} breaker open for ${Math.round(cooldown / 1000)}s after ${failures} consecutive failures`,
    );
  } else {
    breakers.set(provider, { failures, openUntil: 0 });
  }
}

function breakerRecordSuccess(provider: string) {
  const b = breakers.get(provider);
  if (b) breakers.set(provider, { failures: 0, openUntil: 0 });
}

async function callGeminiJson(
  prompt: string,
  opts: ResolvedCallOpts,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return Promise.reject(new Error("GEMINI_API_KEY not configured"));

  const models = geminiModels();
  const attemptErrors: string[] = [];
  let timeoutsSeen = 0;

  for (const model of models) {
    const remaining = opts.deadline - Date.now();
    if (remaining <= 0) {
      attemptErrors.push("Gemini skipped: time budget exhausted");
      break;
    }
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.min(opts.timeoutMs, remaining),
    );
    try {
      const res = await fetch(
        `${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: opts.temperature,
              responseMimeType: "application/json",
            },
          }),
        },
      );
      if (!res.ok) {
        const bodyText = await res.text();
        attemptErrors.push(
          `Gemini ${model} error ${res.status}: ${bodyText.slice(0, 200)}`,
        );
        if (res.status === 429 || res.status >= 500) continue;
        return Promise.reject(new Error(attemptErrors.join(" | ")));
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text) {
        attemptErrors.push(`Gemini ${model} returned empty text`);
        continue;
      }
      return text;
    } catch (e) {
      const err = e as Error;
      if (err?.name === "AbortError") {
        timeoutsSeen += 1;
        attemptErrors.push(`Gemini ${model} timed out`);
        if (timeoutsSeen >= MAX_TIMEOUTS_PER_PROVIDER) {
          return Promise.reject(new Error(attemptErrors.join(" | ")));
        }
        continue;
      }
      attemptErrors.push(err?.message || "Gemini request failed");
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  return Promise.reject(
    attemptErrors.length
      ? new Error(attemptErrors.join(" | "))
      : new Error("All Gemini models failed"),
  );
}

type OpenRouterMessage = {
  content?: unknown;
  reasoning?: unknown;
};

// Cohere/OpenRouter can return content as a string or as an array of typed
// parts. Models that burn the token budget on chain-of-thought may return no
// usable content at all; the caller treats that as a provider failure and
// rotates to the next candidate.
function extractOpenRouterText(data: unknown): string {
  const choices = (
    data as { choices?: Array<{ message?: OpenRouterMessage }> }
  )?.choices;
  const msg = choices?.[0]?.message;
  if (!msg) return "";
  const content = msg.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((p) => {
        const part = p as { text?: unknown };
        return typeof part?.text === "string" ? part.text : "";
      })
      .join("")
      .trim();
  }
  return "";
}

async function callOpenRouterJson(
  prompt: string,
  opts: ResolvedCallOpts,
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    return Promise.reject(new Error("OPENROUTER_API_KEY not configured"));
  }

  const models = openRouterModels();
  const attemptErrors: string[] = [];
  let timeoutsSeen = 0;

  for (const model of models) {
    const remaining = opts.deadline - Date.now();
    if (remaining <= 0) {
      attemptErrors.push("OpenRouter skipped: time budget exhausted");
      break;
    }
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.min(opts.timeoutMs, remaining),
    );
    try {
      const res = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: opts.temperature,
          max_tokens: OPENROUTER_MAX_TOKENS,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        const bodyText = await res.text();
        attemptErrors.push(
          `OpenRouter ${model} error ${res.status}: ${bodyText.slice(0, 160)}`,
        );
        if (res.status === 429 || res.status >= 500) continue;
        return Promise.reject(new Error(attemptErrors.join(" | ")));
      }
      const data = await res.json();
      const text = extractOpenRouterText(data);
      if (!text) {
        attemptErrors.push(`OpenRouter ${model} returned no usable output`);
        continue;
      }
      return text;
    } catch (e) {
      const err = e as Error;
      if (err?.name === "AbortError") {
        timeoutsSeen += 1;
        attemptErrors.push(`OpenRouter ${model} timed out`);
        if (timeoutsSeen >= MAX_TIMEOUTS_PER_PROVIDER) {
          return Promise.reject(new Error(attemptErrors.join(" | ")));
        }
        continue;
      }
      attemptErrors.push(err?.message || "OpenRouter request failed");
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  return Promise.reject(
    attemptErrors.length
      ? new Error(attemptErrors.join(" | "))
      : new Error("All OpenRouter models failed"),
  );
}

async function callCerebrasJson(
  prompt: string,
  opts: ResolvedCallOpts,
): Promise<string> {
  const key = process.env.CEREBRAS_API_KEY?.trim();
  if (!key) {
    return Promise.reject(new Error("CEREBRAS_API_KEY not configured"));
  }

  const models = cerebrasModels();
  const attemptErrors: string[] = [];
  let timeoutsSeen = 0;

  for (const model of models) {
    const remaining = opts.deadline - Date.now();
    if (remaining <= 0) {
      attemptErrors.push("Cerebras skipped: time budget exhausted");
      break;
    }
    // Give each attempt a bit more room than the shared default (Cerebras can
    // spend seconds warm), but never exceed the remaining cross-provider budget.
    const attemptTimeout = Math.min(
      Math.max(opts.timeoutMs, CEREBRAS_MIN_TIMEOUT_MS),
      remaining,
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attemptTimeout);
    try {
      const res = await fetch(CEREBRAS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: opts.temperature,
          max_tokens: OPENROUTER_MAX_TOKENS,
        }),
      });
      if (!res.ok) {
        const bodyText = await res.text();
        attemptErrors.push(
          `Cerebras ${model} error ${res.status}: ${bodyText.slice(0, 160)}`,
        );
        if (res.status === 429 || res.status >= 500) continue;
        return Promise.reject(new Error(attemptErrors.join(" | ")));
      }
      const data = await res.json();
      const text = (data?.choices?.[0]?.message?.content ?? "") as string;
      if (!text) {
        attemptErrors.push(`Cerebras ${model} returned empty text`);
        continue;
      }
      return text;
    } catch (e) {
      const err = e as Error;
      if (err?.name === "AbortError") {
        timeoutsSeen += 1;
        attemptErrors.push(`Cerebras ${model} timed out`);
        if (timeoutsSeen >= MAX_TIMEOUTS_PER_PROVIDER) {
          return Promise.reject(new Error(attemptErrors.join(" | ")));
        }
        continue;
      }
      attemptErrors.push(err?.message || "Cerebras request failed");
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  return Promise.reject(
    attemptErrors.length
      ? new Error(attemptErrors.join(" | "))
      : new Error("All Cerebras models failed"),
  );
}

export async function callAIJson(
  prompt: string,
  options: AIJsonOptions = {},
): Promise<string> {
  const temperature = options.temperature ?? 0.2;
  const timeoutMs = options.timeoutMs ?? 15000;
  const deadlineMs = options.deadlineMs ?? 20000;
  const deadline = Date.now() + deadlineMs;
  const callOpts: ResolvedCallOpts = { temperature, timeoutMs, deadline };
  const errors: string[] = [];
  const skipped: string[] = [];

  const openRouter = isOpenRouterConfigured();
  const cerebras = isCerebrasConfigured();
  const gemini = isGeminiConfigured();
  const validate = options.validate;

  const isValid = (text: string): boolean =>
    typeof validate !== "function" || Boolean(validate(text));

  if (cerebras && breakerAllows("cerebras")) {
    try {
      const text = await callCerebrasJson(prompt, callOpts);
      if (!isValid(text)) {
        breakerRecordFailure("cerebras");
        errors.push("Cerebras returned output that failed validation");
      } else {
        breakerRecordSuccess("cerebras");
        return text;
      }
    } catch (e) {
      breakerRecordFailure("cerebras");
      errors.push((e as Error).message);
    }
  } else if (cerebras) {
    skipped.push("Cerebras (circuit open)");
  }

  if (gemini && breakerAllows("gemini")) {
    try {
      const text = await callGeminiJson(prompt, callOpts);
      if (!isValid(text)) {
        breakerRecordFailure("gemini");
        errors.push("Gemini returned output that failed validation");
      } else {
        breakerRecordSuccess("gemini");
        return text;
      }
    } catch (e) {
      breakerRecordFailure("gemini");
      errors.push((e as Error).message);
    }
  } else if (gemini) {
    skipped.push("Gemini (circuit open)");
  }

  if (openRouter && breakerAllows("openrouter")) {
    try {
      const text = await callOpenRouterJson(prompt, callOpts);
      if (!isValid(text)) {
        breakerRecordFailure("openrouter");
        errors.push("OpenRouter returned output that failed validation");
      } else {
        breakerRecordSuccess("openrouter");
        return text;
      }
    } catch (e) {
      breakerRecordFailure("openrouter");
      errors.push((e as Error).message);
    }
  } else if (openRouter) {
    skipped.push("OpenRouter (circuit open)");
  }

  if (!cerebras && !gemini && !openRouter) {
    return Promise.reject(
      new Error(
        "No AI provider configured. Add CEREBRAS_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.",
      ),
    );
  }
  const notes = skipped.length ? ` [skipped: ${skipped.join(", ")}]` : "";
  return Promise.reject(new Error(errors.join(" | ") + notes));
}
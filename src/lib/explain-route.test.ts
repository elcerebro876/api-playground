import { test } from "node:test";
import assert from "node:assert/strict";
import { handleExplain, sectionsLeakValues } from "@/lib/explain-route";
import type { CachedExplain } from "@/lib/explain-cache";
import type { ExplainModelInput, ExplainSections } from "@/lib/explain";
import type { RateLimitResult } from "@/lib/rate-limit";
import { EXPLAIN_DAILY_MAX_PER_IP, explainGlobalDailyMax } from "@/lib/rate-limit";

const T0 = Date.parse("2026-10-22T12:00:00.000Z");

const body = JSON.stringify({
  id: "abc123",
  name: "Ada Lovelace",
  score: 12345,
  tags: ["math", "logic"],
});

const basePayload = {
  method: "GET",
  url: "https://api.example.com/v1/items/42?page=2",
  apiName: "Example",
  status: 200,
  body,
  contentType: "application/json",
  truncated: false,
  credentialed: false,
};

function makeRequest(payload: Record<string, unknown>): Request {
  return new Request("https://app.test/api/explain", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function deps(overrides: {
  clock?: { now: number };
  cache?: Map<string, CachedExplain>;
  generate?: (input: ExplainModelInput) => Promise<ExplainSections>;
  burst?: RateLimitResult;
  daily?: RateLimitResult;
  global?: RateLimitResult;
} = {}) {
  const cache = overrides.cache ?? new Map<string, CachedExplain>();
  const clock = overrides.clock ?? { now: T0 };
  const sections: ExplainSections = {
    who: "Developers building catalogue tools.",
    what: "It lists catalogue items with a page of results.",
    build: "A small inventory dashboard.",
  };
  const calls = { generate: 0, put: 0, daily: 0, global: 0 };
  const order: string[] = [];
  return {
    calls,
    clock,
    cache,
    order,
    deps: {
      burstLimit: async () => {
        order.push("burst");
        return overrides.burst ?? { ok: true as const, remaining: 1 };
      },
      dailyLimit: async () => {
        calls.daily += 1;
        order.push("daily");
        return overrides.daily ?? { ok: true as const, remaining: 2 };
      },
      globalLimit: async () => {
        calls.global += 1;
        order.push("global");
        return overrides.global ?? { ok: true as const, remaining: 99 };
      },
      cacheGet: async (key: string) => {
        order.push("cacheGet");
        return cache.get(key) ?? null;
      },
      cachePut: async (key: string, value: ExplainSections, ttlSecs: number) => {
        calls.put += 1;
        cache.set(key, {
          sections: value,
          createdAt: new Date(clock.now).toISOString(),
          expiresAt: new Date(clock.now + ttlSecs * 1000).toISOString(),
        });
      },
      generate:
        overrides.generate ??
        (async () => {
          calls.generate += 1;
          order.push("generate");
          return sections;
        }),
      aiConfigured: () => true,
      now: () => clock.now,
    },
  };
}

test("a fresh explanation is returned and cached without body values", async () => {
  const d = deps();
  const res = await handleExplain(makeRequest(basePayload), d.deps);
  assert.equal(res.status, 200);
  const json = (await res.json()) as Record<string, unknown>;
  assert.equal(json.fromCache, false);
  assert.equal(json.truncated, false);
  assert.equal(json.createdAt, new Date(T0).toISOString());
  assert.equal(json.ttlSecs, 30 * 24 * 60 * 60);
  assert.equal(typeof json.who, "string");
  assert.equal(json.who, "Developers building catalogue tools.");
  assert.equal(d.calls.generate, 1);
  assert.equal(d.calls.put, 1);
  assert.equal(d.cache.size, 1);
});

test("a cache hit skips the model and reports the original timestamp", async () => {
  const d = deps();
  const first = await handleExplain(makeRequest(basePayload), d.deps);
  assert.equal(first.status, 200);
  d.clock.now += 3600 * 1000;
  const second = await handleExplain(makeRequest(basePayload), d.deps);
  assert.equal(second.status, 200);
  const json = (await second.json()) as Record<string, unknown>;
  assert.equal(json.fromCache, true);
  assert.equal(json.createdAt, new Date(T0).toISOString());
  assert.equal(json.ttlSecs, 30 * 24 * 60 * 60 - 3600);
  assert.equal(d.calls.generate, 1);
  assert.equal(d.calls.put, 1);
});

test("credentialed requests skip the cache both ways", async () => {
  const d = deps();
  const res = await handleExplain(
    makeRequest({ ...basePayload, credentialed: true }),
    d.deps,
  );
  assert.equal(res.status, 200);
  assert.equal(d.calls.generate, 1);
  assert.equal(d.calls.put, 0);
  assert.equal(d.cache.size, 0);
});

test("a secret query key also disables caching", async () => {
  const d = deps();
  const res = await handleExplain(
    makeRequest({
      ...basePayload,
      url: "https://api.example.com/v1/items?api_key=supersecret",
    }),
    d.deps,
  );
  assert.equal(res.status, 200);
  assert.equal(d.calls.put, 0);
  assert.equal(d.cache.size, 0);
});

test("the model never receives raw URLs or response values", async () => {
  let seen!: ExplainModelInput;
  const d = deps({
    generate: async (input) => {
      seen = input;
      return { who: "a", what: "b", build: "c" };
    },
  });
  await handleExplain(
    makeRequest({
      ...basePayload,
      url: "https://api.example.com/v1/items?token=supersecret",
    }),
    d.deps,
  );
  assert.ok(!seen.endpointUrl.includes("supersecret"));
  assert.ok(!JSON.stringify(seen).includes("Ada Lovelace"));
  assert.ok(!JSON.stringify(seen).includes("12345"));
});

test("generated text that repeats a response value is not cached", async () => {
  const d = deps({
    generate: async () => ({
      who: "Ada Lovelace fans",
      what: "A list.",
      build: "A tracker.",
    }),
  });
  const res = await handleExplain(makeRequest(basePayload), d.deps);
  assert.equal(res.status, 200);
  assert.equal(d.calls.put, 0);
  assert.equal(d.cache.size, 0);
});

test("truncation is passed to the model and echoed in the result", async () => {
  let seen!: ExplainModelInput;
  const d = deps({
    generate: async (input) => {
      seen = input;
      return { who: "a", what: "b", build: "c" };
    },
  });
  const res = await handleExplain(
    makeRequest({ ...basePayload, truncated: true }),
    d.deps,
  );
  const json = (await res.json()) as Record<string, unknown>;
  assert.equal(json.truncated, true);
  assert.equal(seen.truncated, true);
});

test("non-2xx and non-JSON responses are rejected before the model", async () => {
  for (const payload of [
    { ...basePayload, status: 500 },
    { ...basePayload, body: "not json" },
  ]) {
    const d = deps();
    const res = await handleExplain(makeRequest(payload), d.deps);
    assert.equal(res.status, 400);
    assert.equal(d.calls.generate, 0);
  }
});

test("burst limits and missing AI configuration return fixed failures", async () => {
  const limited = await handleExplain(
    makeRequest(basePayload),
    deps({ burst: { ok: false, retryAfter: 30 } }).deps,
  );
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "30");
  const limitedJson = (await limited.json()) as Record<string, unknown>;
  assert.equal(limitedJson.code, "burst");
  assert.equal(limitedJson.retryAfterSec, 30);

  const storeDown = deps({ burst: { ok: false, unavailable: true } });
  const unavailableBurst = await handleExplain(
    makeRequest(basePayload),
    storeDown.deps,
  );
  assert.equal(unavailableBurst.status, 200);
  assert.equal(storeDown.calls.generate, 1);

  const d = deps();
  const noAI = await handleExplain(makeRequest(basePayload), {
    ...d.deps,
    aiConfigured: () => false,
  });
  assert.equal(noAI.status, 503);
  assert.equal(d.calls.generate, 0);
});

test("a fresh model call consumes one daily use and returns the cap", async () => {
  const d = deps({ daily: { ok: true, remaining: 2 } });
  const res = await handleExplain(makeRequest(basePayload), d.deps);
  assert.equal(res.status, 200);
  const json = (await res.json()) as {
    cap?: { remaining: number };
  };
  assert.equal(json.cap?.remaining, 2);
  assert.deepEqual(d.order.slice(0, 4), [
    "burst",
    "cacheGet",
    "daily",
    "global",
  ]);
});

test("cache hits are free: no daily or global use", async () => {
  const d = deps();
  await handleExplain(makeRequest(basePayload), d.deps);
  d.order.length = 0;
  const second = await handleExplain(makeRequest(basePayload), d.deps);
  assert.equal(second.status, 200);
  assert.equal(d.calls.daily, 1);
  assert.equal(d.calls.global, 1);
  assert.deepEqual(d.order, ["burst", "cacheGet"]);
});

test("the per-IP daily cap and the global ceiling return distinct 429s", async () => {
  const daily = await handleExplain(
    makeRequest(basePayload),
    deps({ daily: { ok: false, retryAfter: 900 } }).deps,
  );
  assert.equal(daily.status, 429);
  const dailyJson = (await daily.json()) as Record<string, unknown>;
  assert.equal(dailyJson.code, "cap");
  assert.equal(dailyJson.scope, "ip");
  assert.equal(dailyJson.retryAfterSec, 900);

  const global = await handleExplain(
    makeRequest(basePayload),
    deps({ global: { ok: false, retryAfter: 3600 } }).deps,
  );
  assert.equal(global.status, 429);
  const globalJson = (await global.json()) as Record<string, unknown>;
  assert.equal(globalJson.code, "capacity");
  assert.equal(globalJson.scope, "global");
  assert.equal(globalJson.retryAfterSec, 3600);
});

test("daily and global counters fail open when the store is unavailable", async () => {
  const d = deps({
    daily: { ok: false, unavailable: true },
    global: { ok: false, unavailable: true },
  });
  const res = await handleExplain(makeRequest(basePayload), d.deps);
  assert.equal(res.status, 200);
  assert.equal(d.calls.generate, 1);
});

test("the daily cap is not consumed when AI is not configured", async () => {
  const d = deps();
  const res = await handleExplain(makeRequest(basePayload), {
    ...d.deps,
    aiConfigured: () => false,
  });
  assert.equal(res.status, 503);
  assert.equal(d.calls.daily, 0);
  assert.equal(d.calls.global, 0);
});

test("the explain global daily max defaults to 100 and honors its env override", () => {
  const previous = process.env.EXPLAIN_GLOBAL_DAILY_MAX;
  try {
    delete process.env.EXPLAIN_GLOBAL_DAILY_MAX;
    assert.equal(explainGlobalDailyMax(), 100);
    process.env.EXPLAIN_GLOBAL_DAILY_MAX = "7";
    assert.equal(explainGlobalDailyMax(), 7);
    process.env.EXPLAIN_GLOBAL_DAILY_MAX = "0";
    assert.equal(explainGlobalDailyMax(), 100);
  } finally {
    if (previous === undefined) {
      delete process.env.EXPLAIN_GLOBAL_DAILY_MAX;
    } else {
      process.env.EXPLAIN_GLOBAL_DAILY_MAX = previous;
    }
  }
  assert.equal(EXPLAIN_DAILY_MAX_PER_IP, 3);
});

test("model failures return a fixed error", async () => {
  const d = deps({
    generate: async () => {
      throw new Error("provider exploded");
    },
  });
  const res = await handleExplain(makeRequest(basePayload), d.deps);
  assert.equal(res.status, 500);
  const json = (await res.json()) as Record<string, unknown>;
  assert.equal(json.error, "Couldn't explain this response, try again");
});

test("sectionsLeakValues ignores short values and catches long ones", () => {
  const shortBody = JSON.stringify({ code: "abc", n: 12 });
  assert.equal(
    sectionsLeakValues({ who: "abc 12", what: "", build: "" }, shortBody),
    false,
  );
  const longBody = JSON.stringify({ name: "Ada Lovelace", n: 12345 });
  assert.equal(
    sectionsLeakValues(
      { who: "about Ada Lovelace", what: "", build: "" },
      longBody,
    ),
    true,
  );
  assert.equal(
    sectionsLeakValues({ who: "about 12345", what: "", build: "" }, longBody),
    true,
  );
});

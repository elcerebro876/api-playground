import type { DiagnosisResult } from "@/lib/diagnose";

const STORAGE_KEY = "api-playground-data";

export interface HistoryEntry {
  method: string;
  url: string;
  timestamp: number;
  status: number | null;
  time?: number | null;
  headers?: Record<string, string>;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  apiName?: string;
}

export interface StoredData {
  history: HistoryEntry[];
  discoveryHistory: HistoryEntry[];
  apisTestedCount: number;
  streak: number;
  lastVisitDate: string;
}

const DEFAULTS: StoredData = {
  history: [],
  discoveryHistory: [],
  apisTestedCount: 0,
  streak: 1,
  lastVisitDate: "",
};

export function loadStoredData(): StoredData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw);
    return {
      history: Array.isArray(p.history) ? p.history : [],
      discoveryHistory: Array.isArray(p.discoveryHistory)
        ? p.discoveryHistory
        : [],
      apisTestedCount: typeof p.apisTestedCount === "number" ? p.apisTestedCount : 0,
      streak: typeof p.streak === "number" ? p.streak : 1,
      lastVisitDate: typeof p.lastVisitDate === "string" ? p.lastVisitDate : "",
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveStoredData(data: StoredData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable — silent fallback to in-memory */
  }
}

const EXPLAIN_DISMISSED_KEY = "api-playground-explain-dismissed";

export function loadExplainDismissed(): boolean {
  try {
    return window.localStorage.getItem(EXPLAIN_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveExplainDismissed(dismissed: boolean): void {
  try {
    if (dismissed) {
      window.localStorage.setItem(EXPLAIN_DISMISSED_KEY, "1");
    } else {
      window.localStorage.removeItem(EXPLAIN_DISMISSED_KEY);
    }
  } catch { /* storage unavailable — silent fallback */ }
}

export type CardTestRecord = {
  key: string;
  entry: HistoryEntry;
};
export type CardTestMap = Record<string, CardTestRecord>;

const EXPLAIN_USES_KEY = "api-playground-explain-uses";

function explainDayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function loadExplainUses(now: Date = new Date()): number {
  try {
    const raw = window.localStorage.getItem(EXPLAIN_USES_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { day?: unknown; count?: unknown };
    if (parsed.day !== explainDayKey(now)) return 0;
    return typeof parsed.count === "number" && parsed.count > 0
      ? Math.floor(parsed.count)
      : 0;
  } catch {
    return 0;
  }
}

export function saveExplainUses(count: number, now: Date = new Date()): void {
  try {
    window.localStorage.setItem(
      EXPLAIN_USES_KEY,
      JSON.stringify({ day: explainDayKey(now), count: Math.max(0, count) }),
    );
  } catch { /* storage unavailable - silent fallback */ }
}

const DIAGNOSIS_USES_KEY = "api-playground-diagnosis-uses";

export function loadDiagnosisUses(): number {
  try {
    const raw = window.localStorage.getItem(DIAGNOSIS_USES_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch { /* storage unavailable — silent fallback */ }
  return 0;
}

export function saveDiagnosisUses(count: number): void {
  try {
    window.localStorage.setItem(DIAGNOSIS_USES_KEY, String(count));
  } catch { /* storage unavailable — silent fallback */ }
}

const CARD_TESTS_KEY = "api-playground-card-tests";

export function loadCardTests(): CardTestMap {
  try {
    const raw = window.localStorage.getItem(CARD_TESTS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object" || Array.isArray(p)) return {};
    const map: CardTestMap = {};
    for (const [name, rec] of Object.entries(
      p as Record<string, Partial<CardTestRecord>>,
    )) {
      if (!rec || typeof rec.key !== "string" || !rec.entry) continue;
      map[name] = { key: rec.key, entry: rec.entry as HistoryEntry };
    }
    return map;
  } catch {
    return {};
  }
}

export function saveCardTests(map: CardTestMap): void {
  try {
    window.localStorage.setItem(CARD_TESTS_KEY, JSON.stringify(map));
  } catch { /* storage unavailable — silent fallback */ }
}

export function applyStreakOnLoad(data: StoredData, now: Date = new Date()): StoredData {
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  let s = data.streak;
  let last = data.lastVisitDate;
  if (last !== today) {
    s = last === yesterday ? s + 1 : 1;
    last = today;
  }
  return { ...data, streak: s, lastVisitDate: last };
}

const DIAGNOSIS_CACHE_KEY = "api-playground-diagnosis-cache";
const DIAGNOSIS_CACHE_TTL_MS = 10 * 60 * 1000;
const DIAGNOSIS_CACHE_MAX = 100;

type DiagnosisCacheStore = Record<
  string,
  { value: DiagnosisResult; expires: number }
>;

function readDiagnosisCache(): DiagnosisCacheStore {
  try {
    const raw = window.localStorage.getItem(DIAGNOSIS_CACHE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object" || Array.isArray(p)) return {};
    return p as DiagnosisCacheStore;
  } catch {
    return {};
  }
}

export function loadDiagnosisCache(key: string): DiagnosisResult | null {
  const entry = readDiagnosisCache()[key];
  if (
    !entry ||
    !entry.value ||
    typeof entry.expires !== "number" ||
    entry.expires <= Date.now()
  ) {
    return null;
  }
  return entry.value;
}

export function saveDiagnosisCache(
  key: string,
  value: DiagnosisResult,
  ttlMs: number = DIAGNOSIS_CACHE_TTL_MS,
): void {
  try {
    const store = readDiagnosisCache();
    store[key] = { value, expires: Date.now() + ttlMs };
    const now = Date.now();
    // Drop expired entries, then keep only the newest by expiry.
    const live = Object.keys(store)
      .filter((k) => store[k]?.expires > now)
      .sort((a, b) => store[a].expires - store[b].expires);
    const keep = live.slice(-DIAGNOSIS_CACHE_MAX);
    const next: DiagnosisCacheStore = {};
    for (const k of keep) next[k] = store[k];
    window.localStorage.setItem(DIAGNOSIS_CACHE_KEY, JSON.stringify(next));
  } catch { /* storage unavailable — silent fallback */ }
}
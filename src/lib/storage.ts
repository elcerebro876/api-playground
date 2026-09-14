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
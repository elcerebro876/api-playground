"use client";

import { useState, useEffect, useCallback, useRef, Fragment, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingState from "@/components/LoadingState";
import { loadStoredData, saveStoredData, applyStreakOnLoad, type HistoryEntry } from "@/lib/storage";

const cardTextSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

const cardContentVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: cardTextSpring,
  },
};

const headersPanelTransition = {
  duration: 0.25,
  ease: "easeInOut" as const,
};

const commonKeys = ["content-type", "date", "cache-control", "cf-cache-status", "etag"];
export default function Home() {
  const [activeTheme, setActiveTheme] = useState("Light");
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headerKey, setHeaderKey] = useState("");
  const [headerBearer, setHeaderBearer] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [response, setResponse] = useState<{ status?: number; ok?: boolean; time?: number; headers?: Record<string, string>; body?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [apisTested, setApisTested] = useState(0);
  const [streak, setStreak] = useState(1);
  const responseKey = useRef(0);
  const [headersFilter, setHeadersFilter] = useState("common");
  const [activeHistoryIndex, setActiveHistoryIndex] = useState<number | null>(null);
  const [explorerHovered, setExplorerHovered] = useState(false);

  useEffect(() => {
    const data = loadStoredData();
    setHistory(data.history);
    setApisTested(data.apisTestedCount);
    const updated = applyStreakOnLoad(data);
    setStreak(updated.streak);
    saveStoredData(updated);
  }, []);

  const handleHistorySelect = (item: any, index: number) => {
    setActiveHistoryIndex(index);
    setMethod(item.method);
    setUrl(item.url);
    if (item.responseBody) {
      setResponse({ status: item.status, time: item.time, body: item.responseBody, headers: item.responseHeaders });
      setHeadersFilter("common");
    }
  };

  const sendRequest = useCallback(async (opts?: { method?: string; url?: string; headers?: Record<string, string> }) => {
    setLoading(true);
    setResponse(null);
    const m = opts?.method || method;
    const u = opts?.url || url;
    const h: Record<string, string> = {};
    if (opts?.headers) {
      Object.assign(h, opts.headers);
    } else {
      if (headerKey && headerValue) h[headerKey] = headerValue;
      if (headerBearer) h["Authorization"] = `Bearer ${headerBearer}`;
    }
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: m, url: u, headers: h, body: undefined }),
      });
      const data = await res.json();
      responseKey.current += 1;
      setResponse(data);
      setHeadersFilter("common");
      const entry = { method: m, url: u, status: data.status, time: data.time, timestamp: Date.now(), headers: h, responseBody: data.body, responseHeaders: data.headers };
      const nextHistory = [entry, ...history];
      setHistory(nextHistory);
      setApisTested((c) => c + 1);
      saveStoredData({ history: nextHistory, apisTestedCount: apisTested + 1, streak, lastVisitDate: new Date().toDateString() });
      setActiveHistoryIndex(0);
      setLoading(false);
    } catch {
      responseKey.current += 1;
      setResponse({ error: "Network error" });
      setHeadersFilter("common");
      const entry = { method: m, url: u, status: null, time: null, timestamp: Date.now(), headers: h };
      const nextHistory = [entry, ...history];
      setHistory(nextHistory);
      saveStoredData({ history: nextHistory, apisTestedCount: apisTested, streak, lastVisitDate: new Date().toDateString() });
      setActiveHistoryIndex(0);
      setLoading(false);
    }
}, [method, url, headerKey, headerBearer, headerValue, history, apisTested, streak]);

  const lowestLatency = useMemo(() => {
    const times = history.map((item) => item.time).filter((t): t is number => typeof t === "number" && t > 0);
    return times.length ? Math.min(...times) : null;
  }, [history]);

  return (
    <div className={`relative h-screen overflow-hidden font-sans ${activeTheme === "Dark" ? "bg-[#111111]" : "bg-white"}`} style={{ minWidth: 900 }}>
      <div className="absolute" style={{ left: 12, top: 12 }}>
        <span
          className={`text-sm font-medium tracking-[-0.07em] ${activeTheme === "Dark" ? "text-white" : "text-[#222222]"}`}
          style={{ fontFamily: "Geist, var(--font-geist-sans)", fontWeight: 500 }}
        >
          Playground
        </span>
      </div>

      <div
        className="absolute overflow-hidden"
        style={{
          top: 42,
          right: 32,
          bottom: 32,
          left: 48,
          backgroundColor: activeTheme === "Dark" ? "#161616" : "#FAFAFAFA",
          border: activeTheme === "Dark" ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2",
          borderRadius: 16,
        }}
      >
        <div className="flex h-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Sidebar activeTheme={activeTheme} onThemeChange={setActiveTheme} history={history} activeHistoryIndex={activeHistoryIndex} onSelect={handleHistorySelect} onRetry={(item) => sendRequest({ method: item.method, url: item.url, headers: item.headers })} />
          </motion.div>
          <div className="flex flex-col py-4">
            <div className={`w-px flex-1 ${activeTheme === "Dark" ? "bg-[#2d2d2d]" : "bg-[#ededed]"}`} />
          </div>
          <motion.div
            className="flex min-w-0 flex-1 flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <MainContent activeTheme={activeTheme} method={method} setMethod={setMethod} url={url} setUrl={setUrl} headerKey={headerKey} setHeaderKey={setHeaderKey} headerBearer={headerBearer} setHeaderBearer={setHeaderBearer} headerValue={headerValue} setHeaderValue={setHeaderValue} response={response} loading={loading} onSend={(opts) => sendRequest(opts)} responseKey={responseKey.current} headersFilter={headersFilter} setHeadersFilter={setHeadersFilter} history={history} activeHistoryIndex={activeHistoryIndex} onHistorySelect={handleHistorySelect} />
          </motion.div>
        </div>
      </div>

      <div className="absolute" style={{ left: 12, top: 54, cursor: "pointer" }} onClick={() => { setResponse(null); setActiveHistoryIndex(null); setUrl(""); setMethod("GET"); setHeaderKey(""); setHeaderBearer(""); setHeaderValue(""); setHeadersFilter("common"); }}>
        <IconlyPlus />
      </div>

      <AnimatePresence>
        {explorerHovered && (
          <motion.div
            key="glass"
            className="absolute inset-0"
            style={{
              zIndex: 5,
              pointerEvents: "none",
              backdropFilter: "blur(36.75px)",
              WebkitBackdropFilter: "blur(36.75px)",
              background:
                activeTheme === "Dark"
                  ? "linear-gradient(-23.5deg, rgba(36, 36, 36, 0.47), rgba(129, 129, 129, 0))"
                  : "linear-gradient(-23.5deg, rgba(180, 180, 180, 0.47), rgba(230, 230, 230, 0))",
              opacity: 0.75,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <div
        className="absolute"
        style={{ left: 12, bottom: 48, zIndex: 10 }}
        onMouseEnter={() => setExplorerHovered(true)}
        onMouseLeave={() => setExplorerHovered(false)}
      >
        <div className="overflow-hidden" style={{ width: 24, height: 24, borderRadius: 8 }}>
          <img
            src="/Explorer%20image.jpg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
        </div>
        <AnimatePresence>
          {explorerHovered && <ExplorerCard key="card" activeTheme={activeTheme} apisTested={apisTested} streak={streak} lowestLatency={lowestLatency} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ExplorerCard({ activeTheme, apisTested, streak, lowestLatency }: { activeTheme: string; apisTested: number; streak: number; lowestLatency: number | null }) {
  const isDark = activeTheme === "Dark";
  const streakLabel = `${streak} ${streak === 1 ? "day" : "days"} streak`;
  return (
    <motion.div
      className="absolute"
      style={{ bottom: 0, left: 0, zIndex: 10, width: 241, height: 229, borderRadius: 12, backgroundColor: isDark ? "#0f0f0f" : "#ffffff", border: isDark ? "0.8px solid #312f2f" : "none", pointerEvents: "none" }}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div style={{ position: "absolute", top: 12, left: 12, width: 54, height: 54, borderRadius: 8, overflow: "hidden" }}>
        <img
          src="/Explorer%20image.jpg"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
        />
      </div>
      <span style={{ position: "absolute", top: 16, left: 74, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isDark ? "#f7f7f7" : "#4f4f4f", whiteSpace: "nowrap" }}>Explorer #1</span>
      <div style={{ position: "absolute", top: 38, left: 74, display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", borderRadius: 8, backgroundColor: isDark ? "#3a1212" : "#ffe7e7" }}>
        <svg viewBox="0 0 16 16" style={{ width: 16, height: 16 }}>
          <path d="M7 0c0.66667 2.66667 2 4.83333 4 6.5 2 1.66667 3 3.5 3 5.5 0 1.85652-0.7375 3.63699-2.05025 4.94975-1.31276 1.31275-3.09323 2.05025-4.94975 2.05025-1.85652 0-3.63699-0.7375-4.94975-2.05025-1.31275-1.31275-2.05025-3.09323-2.05025-4.94975 0-1.08185 0.35089-2.13452 1-3 0 0.66304 0.26339 1.29893 0.73223 1.76777 0.46884 0.46884 1.10473 0.73223 1.76777 0.73223 0.66304 0 1.29893-0.26339 1.76777-0.73223 0.46884-0.46884 0.73223-1.10473 0.73223-1.76777 0-2-1.5-3-1.5-5 0-1.33333 0.83333-2.66667 2.5-4z" fill="#ff3636" transform="translate(3.3333 2) scale(0.6667)" />
        </svg>
        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: "#ff3636", whiteSpace: "nowrap" }}>{streakLabel}</span>
      </div>
      <div style={{ position: "absolute", top: 78, left: 12, width: 217, height: 111, borderRadius: 8, backgroundColor: isDark ? "#1b1b1b" : "#ffffff", border: `0.8px solid ${isDark ? "#2d2d2d" : "#f2f2f2"}` }}>
        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#4f4f4f" }}>Stats</span>
        <div style={{ position: "absolute", top: 36, left: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: "#a0a0ff" }} />
        <span style={{ position: "absolute", top: 32, left: 16, fontSize: 14, letterSpacing: "-0.7px", color: isDark ? "#adadad" : "#737373" }}>{apisTested} APIs tested</span>
        <div style={{ position: "absolute", top: 58, left: 8, width: 174, height: 0, borderTop: `0.8px solid ${isDark ? "#2d2d2d" : "#f2f2f2"}` }} />
        <div style={{ position: "absolute", top: 70, left: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: "#a0a0ff" }} />
        <span style={{ position: "absolute", top: 66, left: 16, fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isDark ? "#ffffff" : "#3a3a3a" }}>{lowestLatency !== null ? `${lowestLatency}ms` : "--"}</span>
        <span style={{ position: "absolute", top: 66, left: 57, fontSize: 14, letterSpacing: "-0.7px", color: isDark ? "#adadad" : "#737373" }}>is the lowest latency you</span>
        <span style={{ position: "absolute", top: 85, left: 16, fontSize: 14, letterSpacing: "-0.7px", color: isDark ? "#adadad" : "#737373" }}>have hit</span>
      </div>
      <div style={{ position: "absolute", top: 201, left: 76, display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 12, letterSpacing: "-0.6px", color: isDark ? "#adadad" : "#737373" }}>Built with love</span>
        <svg viewBox="0 0 16 16" style={{ width: 16, height: 16 }}>
          <path d="M15.65387 7.68097l-0.025 0c-0.414-0.015-0.739-0.361-0.725-0.77502 0.032-0.951-0.433-1.568-1.244-1.651-0.412-0.042-0.712-0.41-0.67-0.822 0.043-0.411 0.413-0.714 0.823-0.67 1.608 0.164 2.649 1.447 2.59 3.193-0.014 0.40602-0.347 0.72502-0.749 0.72502z m-0.082-7.41402c-1.72-0.55-4.101-0.322-5.587 1.364-1.561-1.674-3.86101-1.917-5.56901-1.363-3.915 1.26-5.136 5.796-4.022 9.27502 1.758 5.471 7.60301 8.423 9.60501 8.423 1.787 0 7.864-2.896 9.602-8.423 1.114-3.47802-0.11-8.01402-4.029-9.27602z" fill="#ff3636" fillRule="evenodd" transform="translate(1.50195 2.01135) scale(0.6667)" />
        </svg>
      </div>
    </motion.div>
  );
}

function Sidebar({
  activeTheme,
  onThemeChange,
  history,
  activeHistoryIndex,
  onSelect,
  onRetry,
}: {
  activeTheme: string;
  onThemeChange: (t: string) => void;
  history: any[];
  activeHistoryIndex: number | null;
  onSelect: (item: any, index: number) => void;
  onRetry: (item: any) => void;
}) {
  return (
    <div className="flex h-full w-[172px] shrink-0 flex-col">
      <div className="flex shrink-0 items-center px-4 pt-4">
        <span
          className={`text-sm font-medium ${activeTheme === "Dark" ? "text-white" : "text-[#585858]"}`}
          style={{ fontFamily: "Geist, var(--font-geist-sans)", fontWeight: 500, letterSpacing: "-0.7px" }}
        >
          Explorer Log
        </span>
        <div className="ml-auto flex h-4 w-4 items-center justify-center">
          <div style={{ height: 16, overflow: "hidden", position: "relative", width: 16 }}>
            <svg viewBox="-1e-6 -2e-6 19.285 20.721" preserveAspectRatio="none" style={{ height: 13.814, left: 1.333, overflow: "visible", position: "absolute", top: 1.334, width: 12.857 }}>
              <path
                d="M10.267 0c.716 0 1.412.294 1.911.805.498.514.773 1.219.752 1.934.002.161.055.347.151.51.159.27.41.46.708.538.298.074.61.034.875-.123 1.28-.731 2.909-.293 3.64.977l.623 1.079c.016.029.03.057.042.086.662 1.251.22 2.826-1.01 3.545-.179.103-.324.247-.424.421-.155.269-.198.589-.12.883.08.3.271.549.54.703.607.349 1.06.937 1.241 1.616.181.678.082 1.414-.271 2.021l-.664 1.106c-.731 1.256-2.36 1.691-3.627.959-.169-.097-.364-.15-.558-.155h-.006c-.289 0-.586.123-.802.338-.219.219-.339.511-.337.821-.007 1.469-1.202 2.657-2.664 2.657h-1.253c-1.469 0-2.664-1.194-2.664-2.663-.002-.181-.054-.369-.151-.532-.157-.274-.411-.47-.704-.548-.291-.078-.61-.035-.872.117-.628.35-1.367.435-2.043.245-.675-.191-1.258-.655-1.6-1.27l-.625-1.077c-.731-1.268-.296-2.893.97-3.625.359-.207.582-.593.582-1.007 0-.414-.223-.801-.582-1.008-1.267-.736-1.701-2.365-.971-3.633l.678-1.113c.721-1.254 2.351-1.696 3.622-.966.173.103.361.155.552.157.623 0 1.144-.514 1.154-1.146-.004-.697.271-1.366.772-1.871.503-.504 1.171-.781 1.882-.781h1.253zm0 1.5h-1.253c-.31 0-.6.121-.819.339-.218.219-.337.51-.335.82-.021 1.462-1.216 2.639-2.663 2.639-.464-.005-.911-.13-1.299-.362-.545-.31-1.257-.119-1.576.436l-.677 1.113c-.31.538-.12 1.249.432 1.57.819.474 1.33 1.358 1.33 2.306 0 .948-.511 1.831-1.332 2.306-.549.318-.739 1.025-.421 1.575l.631 1.088c.156.281.411.484.706.567.294.082.618.047.888-.103.397-.233.859-.354 1.323-.354.229 0 .458.029.682.089.676.182 1.263.634 1.611 1.241.226.381.351.826.355 1.28 0 .65.522 1.171 1.164 1.171h1.253c.639 0 1.161-.518 1.164-1.157-.004-.706.272-1.377.777-1.882.498-.498 1.194-.797 1.89-.777.456.011.895.134 1.282.354.557.319 1.268.129 1.59-.421l.664-1.107c.148-.255.191-.575.112-.87-.078-.295-.274-.551-.538-.702-.618-.356-1.059-.93-1.242-1.618-.181-.675-.082-1.412.271-2.019.23-.4.567-.737.971-.969.542-.317.732-1.026.417-1.578l-.035-.069-.586-1.016c-.319-.555-1.029-.746-1.586-.429-.602.356-1.318.458-2.006.277-.687-.178-1.263-.613-1.622-1.227-.23-.384-.355-.831-.359-1.286.009-.342-.111-.649-.329-.874-.217-.224-.522-.351-.835-.351zm-.622 5.474c1.867 0 3.386 1.52 3.386 3.387s-1.519 3.385-3.386 3.385-3.386-1.518-3.386-3.385 1.519-3.387 3.386-3.387zm0 1.5c-1.04 0-1.886.847-1.886 1.887s.846 1.885 1.886 1.885 1.886-.845 1.886-1.885-.846-1.887-1.886-1.887z"
                fill="#585858"
                fillRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto" style={{ minHeight: 0 }}>
        {history.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3" style={{ paddingLeft: 12, paddingRight: 12 }}>
          <div style={{ boxSizing: "border-box", flexShrink: 0, height: 32, overflow: "hidden", position: "relative", width: 32 }}>
            <svg viewBox="0 0 37.5801 16.5399" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 4.268, left: 11.099, overflow: "visible", position: "absolute", top: 19.12, width: 9.698, zIndex: 0 }}>
              <path d="M36.76 0.4099c0.33-0.07 0.6101-0.1999 0.8201-0.4099l-0.8201 0.4099z m-36.76 16.13c0.24-0.07 0.4599-0.18 0.6399-0.32l-0.6399 0.32z" fill="#5b5bff" />
              <path d="M36.76 0.4099c0.33-0.07 0.6101-0.1999 0.8201-0.4099l-0.8201 0.4099z m-36.76 16.13c0.24-0.07 0.4599-0.18 0.6399-0.32l-0.6399 0.32z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg viewBox="0 0 17.1902 2.6" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 1, left: 16.361, overflow: "visible", position: "absolute", top: 18.555, width: 4.436, zIndex: 1 }}>
              <path d="M0 0.39l0.7901-0.39m15.5801 2.6c0.33-0.07 0.61-0.1999 0.82-0.40991l-0.82 0.40991z" fill="#5b5bff" />
              <path d="M0 0.39l0.7901-0.39m15.5801 2.6c0.33-0.07 0.61-0.1999 0.82-0.40991l-0.82 0.40991z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg viewBox="-1.9e-6 -2.1e-6 36.9899 47.6745" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 12.303, left: 13.308, overflow: "visible", position: "absolute", top: 19.158, width: 9.546, zIndex: 2 }}>
              <path d="M36.9799 34.12379c-0.07-5.75-1.8801-11.6701-5.4001-17.7501-3.25-5.6-7.0998-9.8699-11.5698-12.8199-0.5-0.33-1.0101-0.64-1.5201-0.94-2.09-1.21-4.0501-1.9901-5.8901-2.37011-2.3-0.46-4.4-0.2699-6.3 0.5801l-0.8899 0.43991c-0.06 0.03-0.12 0.07-0.18 0.11-3.27 1.95-5.0099 5.5301-5.2099 10.73009-0.01 0.34-0.02 0.6899-0.02 1.04991 0 5.88 1.7999 11.92 5.4099 18.1401 3.6 6.23 7.96 10.81 13.08 13.77 5.12 2.95 9.4799 3.4 13.0899 1.35 3.6-2.06 5.41009-6.03 5.41009-11.9 0-0.13 0-0.26 0-0.39l-0.00999 0z m-11.09 2.47999c-0.37 0.21-0.8001 0.17001-1.2901-0.11999-0.5-0.28-0.93-0.74001-1.3-1.38001l-5.5498-9.5701c-0.37-0.64-0.6501-1.28-0.8301-1.90999-0.19-0.64-0.28-1.2399-0.28-1.8099l0-9.6601c0-0.56 0.19-0.95 0.56-1.16001 0.37-0.21 0.8-0.1799 1.29 0.1101 0.49 0.28 0.9299 0.75 1.2999 1.38001 0.37 0.64 0.55 1.2399 0.55 1.8099l0 9.7601 5.5501 9.57c0.37 0.64 0.55 1.24 0.55 1.80999 0 0.57-0.18 0.95-0.55 1.17z" fill="#5b5bff" />
              <path d="M36.9799 34.12379c-0.07-5.75-1.8801-11.6701-5.4001-17.7501-3.25-5.6-7.0998-9.8699-11.5698-12.8199-0.5-0.33-1.0101-0.64-1.5201-0.94-2.09-1.21-4.0501-1.9901-5.8901-2.37011-2.3-0.46-4.4-0.2699-6.3 0.5801l-0.8899 0.43991c-0.06 0.03-0.12 0.07-0.18 0.11-3.27 1.95-5.0099 5.5301-5.2099 10.73009-0.01 0.34-0.02 0.6899-0.02 1.04991 0 5.88 1.7999 11.92 5.4099 18.1401 3.6 6.23 7.96 10.81 13.08 13.77 5.12 2.95 9.4799 3.4 13.0899 1.35 3.6-2.06 5.41009-6.03 5.41009-11.9 0-0.13 0-0.26 0-0.39l-0.00999 0z m-11.09 2.47999c-0.37 0.21-0.8001 0.17001-1.2901-0.11999-0.5-0.28-0.93-0.74001-1.3-1.38001l-5.5498-9.5701c-0.37-0.64-0.6501-1.28-0.8301-1.90999-0.19-0.64-0.28-1.2399-0.28-1.8099l0-9.6601c0-0.56 0.19-0.95 0.56-1.16001 0.37-0.21 0.8-0.1799 1.29 0.1101 0.49 0.28 0.9299 0.75 1.2999 1.38001 0.37 0.64 0.55 1.2399 0.55 1.8099l0 9.7601 5.5501 9.57c0.37 0.64 0.55 1.24 0.55 1.80999 0 0.57-0.18 0.95-0.55 1.17z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg viewBox="-2.1e-7 -2.1e-6 9.8 25.8785" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 6.678, left: 17.602, overflow: "visible", position: "absolute", top: 21.96, width: 2.529, zIndex: 3 }}>
              <path d="M9.8 24.57624c0 0.57-0.18 0.95-0.55 1.17-0.37 0.21-0.8001 0.17-1.2901-0.11999-0.5-0.28-0.93-0.74001-1.3-1.38001l-5.5498-9.5701c-0.37-0.64-0.6501-1.28-0.8301-1.90999-0.19-0.64-0.28-1.2399-0.28-1.8099l0-9.6601c0-0.56 0.19-0.95 0.56-1.16001 0.37-0.21 0.8001-0.1799 1.2901 0.1101 0.49 0.28 0.9298 0.75 1.2998 1.38001 0.37 0.64 0.55 1.2399 0.55 1.8099l0 9.76 5.5501 9.5701c0.37 0.64 0.55 1.24 0.55 1.80999z" fill="#5b5bff" />
              <path d="M9.8 24.57624c0 0.57-0.18 0.95-0.55 1.17-0.37 0.21-0.8001 0.17-1.2901-0.11999-0.5-0.28-0.93-0.74001-1.3-1.38001l-5.5498-9.5701c-0.37-0.64-0.6501-1.28-0.8301-1.90999-0.19-0.64-0.28-1.2399-0.28-1.8099l0-9.6601c0-0.56 0.19-0.95 0.56-1.16001 0.37-0.21 0.8001-0.1799 1.2901 0.1101 0.49 0.28 0.9298 0.75 1.2998 1.38001 0.37 0.64 0.55 1.2399 0.55 1.8099l0 9.76 5.5501 9.5701c0.37 0.64 0.55 1.24 0.55 1.80999z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg viewBox="-2.9e-6 -1.9e-6 50.6902 52.3901" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 13.52, left: 14.936, overflow: "visible", position: "absolute", top: 17.615, width: 13.081, zIndex: 4 }}>
              <path d="M50.6802 30.49c0 5.8701-1.8102 9.8401-5.4102 11.9001l-0.8899 0.43999-19.1101 9.56001c3.6-2.06 5.4102-6.03 5.4102-11.9 0-0.13 0-0.26 0-0.39-0.07-5.75-1.8802-11.6701-5.4002-17.7501-3.25-5.6-7.0998-9.87-11.5698-12.82-0.5-0.33-1.01-0.6399-1.52-0.9399-2.09-1.21-4.0501-1.9901-5.8901-2.37011-2.3-0.46-4.4001-0.27-6.3001 0.58001l5.53-2.77 0.7901-0.39 6.4199-3.21c0.75 0.45 1.51 0.93999 2.25 1.46999 0.23 0.15 0.4502 0.31 0.6702 0.47001 1.14 0.83 2.23 1.73 3.28 2.69 1.05 0.96 2.04 1.35 2.96 1.18 0.33-0.07 0.61-0.1999 0.82-0.40991l0.0298-0.02009 11.6401-5.81c4.18 2.92 7.8099 7.04 10.8899 12.35 3.6 6.22 5.4102 12.27 5.4102 18.14l-0.01 0z" fill="#5b5bff" />
              <path d="M50.6802 30.49c0 5.8701-1.8102 9.8401-5.4102 11.9001l-0.8899 0.43999-19.1101 9.56001c3.6-2.06 5.4102-6.03 5.4102-11.9 0-0.13 0-0.26 0-0.39-0.07-5.75-1.8802-11.6701-5.4002-17.7501-3.25-5.6-7.0998-9.87-11.5698-12.82-0.5-0.33-1.01-0.6399-1.52-0.9399-2.09-1.21-4.0501-1.9901-5.8901-2.37011-2.3-0.46-4.4001-0.27-6.3001 0.58001l5.53-2.77 0.7901-0.39 6.4199-3.21c0.75 0.45 1.51 0.93999 2.25 1.46999 0.23 0.15 0.4502 0.31 0.6702 0.47001 1.14 0.83 2.23 1.73 3.28 2.69 1.05 0.96 2.04 1.35 2.96 1.18 0.33-0.07 0.61-0.1999 0.82-0.40991l0.0298-0.02009 11.6401-5.81c4.18 2.92 7.8099 7.04 10.8899 12.35 3.6 6.22 5.4102 12.27 5.4102 18.14l-0.01 0z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg viewBox="-2.6e-6 -3.5e-6 66.5898 78.5897" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 20.281, left: 3.76, overflow: "visible", position: "absolute", top: 3.13, width: 17.184, zIndex: 5 }}>
              <path d="M66.19994 42.75c-0.15-0.59-0.3401-1.1899-0.5801-1.7899-0.49-1.24-1.1199-2.4201-1.8999-3.5401-0.26-0.38-0.54-0.75-0.83-1.11l-6.5-8.04-19.3899-24c-0.56-0.68-1.1501-1.3-1.7601-1.86-0.62-0.57-1.2701-1.0499-1.9401-1.4399-0.68-0.4-1.3099-0.6501-1.8999-0.7801-0.59-0.13-1.1901-0.19-1.8001-0.19l-9.5998 0.79-16.30009 1.34c-0.39 0.03-0.75008 0.11-1.08008 0.24l-0.03003 0c-0.11 0.05-0.21983 0.1-0.32983 0.16-0.51 0.25-0.94004 0.62-1.29004 1.11-0.64 0.89-0.96997 2.1201-0.96997 3.6801l0 33.75c0 1.55 0.32997 3.1499 0.96997 4.7999 0.65 1.65 1.55998 3.19999 2.72998 4.65l21.17989 26.24c1.23 1.49 2.4201 2.07 3.5601 1.74l0.6399-0.32c0.66-0.53 0.9002-1.55 0.7002-3.05-0.12-0.63-0.1802-1.29001-0.1802-1.96l0-2.18c0-7.35 2.0201-12.56 6.0801-15.63 0.47-0.37 0.97-0.7 1.5-1 3.82-2.17 8.23-2.3499 13.23-0.5299 1.63 0.58 3.32 1.3899 5.08 2.3999 0.18 0.11 0.3699 0.21 0.5499 0.33 0.75 0.45 1.51 0.94 2.25 1.47 0.23 0.15 0.4501 0.31 0.6701 0.47 1.14 0.83 2.23 1.73 3.28 2.69 1.05 0.96 2.04001 1.35 2.96 1.18l0.8201-0.4099 0.0298-0.0201c0.36-0.37 0.54-0.9499 0.54-1.7399l0-14.4401c0-0.98-0.1299-1.99-0.3899-3.01z m-8.6699 1.42c-0.02 0.21-0.0501 0.41-0.1001 0.61-0.24 1.02-0.7999 1.57-1.6599 1.63l-1.4302 0.12-17.3398 1.46c-0.56 0.03-1.1501-0.0199-1.7601-0.1599-0.62-0.15-1.2701-0.4201-1.9401-0.8101-0.68-0.39-1.33-0.8699-1.95-1.4399-0.61-0.56-1.2-1.19-1.75-1.86l-9.5698-11.88-9.1101-11.3201c-0.87-1.07-1.44-2.26-1.72-3.59-0.27-1.33-0.1699-2.34 0.3301-3.05 0.49-0.71 1.23-0.92 2.22-0.63 0.98 0.29 1.91 0.96 2.77 2.03l5.48 6.78 13.2998 16.47 18.77-1.5699c0.86-0.07 1.79 0.3199 2.77 1.1699 0.99 0.86 1.73 1.9201 2.22 3.1901 0.4 1.03 0.5602 1.9799 0.4702 2.8499z" fill="#5b5bff" />
              <path d="M66.19994 42.75c-0.15-0.59-0.3401-1.1899-0.5801-1.7899-0.49-1.24-1.1199-2.4201-1.8999-3.5401-0.26-0.38-0.54-0.75-0.83-1.11l-6.5-8.04-19.3899-24c-0.56-0.68-1.1501-1.3-1.7601-1.86-0.62-0.57-1.2701-1.0499-1.9401-1.4399-0.68-0.4-1.3099-0.6501-1.8999-0.7801-0.59-0.13-1.1901-0.19-1.8001-0.19l-9.5998 0.79-16.30009 1.34c-0.39 0.03-0.75008 0.11-1.08008 0.24l-0.03003 0c-0.11 0.05-0.21983 0.1-0.32983 0.16-0.51 0.25-0.94004 0.62-1.29004 1.11-0.64 0.89-0.96997 2.1201-0.96997 3.6801l0 33.75c0 1.55 0.32997 3.1499 0.96997 4.7999 0.65 1.65 1.55998 3.19999 2.72998 4.65l21.17989 26.24c1.23 1.49 2.4201 2.07 3.5601 1.74l0.6399-0.32c0.66-0.53 0.9002-1.55 0.7002-3.05-0.12-0.63-0.1802-1.29001-0.1802-1.96l0-2.18c0-7.35 2.0201-12.56 6.0801-15.63 0.47-0.37 0.97-0.7 1.5-1 3.82-2.17 8.23-2.3499 13.23-0.5299 1.63 0.58 3.32 1.3899 5.08 2.3999 0.18 0.11 0.3699 0.21 0.5499 0.33 0.75 0.45 1.51 0.94 2.25 1.47 0.23 0.15 0.4501 0.31 0.6701 0.47 1.14 0.83 2.23 1.73 3.28 2.69 1.05 0.96 2.04001 1.35 2.96 1.18l0.8201-0.4099 0.0298-0.0201c0.36-0.37 0.54-0.9499 0.54-1.7399l0-14.4401c0-0.98-0.1299-1.99-0.3899-3.01z m-8.6699 1.42c-0.02 0.21-0.0501 0.41-0.1001 0.61-0.24 1.02-0.7999 1.57-1.6599 1.63l-1.4302 0.12-17.3398 1.46c-0.56 0.03-1.1501-0.0199-1.7601-0.1599-0.62-0.15-1.2701-0.4201-1.9401-0.8101-0.68-0.39-1.33-0.8699-1.95-1.4399-0.61-0.56-1.2-1.19-1.75-1.86l-9.5698-11.88-9.1101-11.3201c-0.87-1.07-1.44-2.26-1.72-3.59-0.27-1.33-0.1699-2.34 0.3301-3.05 0.49-0.71 1.23-0.92 2.22-0.63 0.98 0.29 1.91 0.96 2.77 2.03l5.48 6.78 13.2998 16.47 18.77-1.5699c0.86-0.07 1.79 0.3199 2.77 1.1699 0.99 0.86 1.73 1.9201 2.22 3.1901 0.4 1.03 0.5602 1.9799 0.4702 2.8499z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg viewBox="-5.9e-6 -2.1e-6 48.5008 34.8745" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 9, left: 6.096, overflow: "visible", position: "absolute", top: 6.517, width: 12.516, zIndex: 6 }}>
              <path d="M48.47641 31.04625c-0.02 0.21-0.0501 0.41-0.1001 0.61-0.24 1.02-0.7999 1.57-1.6599 1.63l-1.4302 0.12-17.33979 1.4599c-0.56 0.03-1.15-0.0199-1.76-0.1599-0.62-0.15-1.2702-0.42-1.94021-0.81-0.68-0.39-1.33-0.87-1.94999-1.44-0.61-0.56-1.2-1.19-1.75-1.86l-9.56981-11.88-9.11009-11.32c-0.87-1.07-1.44-2.26-1.72001-3.59-0.27-1.33-0.1699-2.3401 0.33011-3.0501 0.49-0.71 1.23-0.92 2.22-0.63 0.98 0.29 1.91 0.9601 2.76999 2.0301l5.48 6.78 13.2998 16.47 18.77-1.57c0.86-0.07 1.79 0.3199 2.77 1.1699 0.99 0.86 1.73 1.9201 2.22 3.1901 0.4 1.03 0.5602 1.98 0.4702 2.85z" fill="#5b5bff" />
              <path d="M48.47641 31.04625c-0.02 0.21-0.0501 0.41-0.1001 0.61-0.24 1.02-0.7999 1.57-1.6599 1.63l-1.4302 0.12-17.33979 1.4599c-0.56 0.03-1.15-0.0199-1.76-0.1599-0.62-0.15-1.2702-0.42-1.94021-0.81-0.68-0.39-1.33-0.87-1.94999-1.44-0.61-0.56-1.2-1.19-1.75-1.86l-9.56981-11.88-9.11009-11.32c-0.87-1.07-1.44-2.26-1.72001-3.59-0.27-1.33-0.1699-2.3401 0.33011-3.0501 0.49-0.71 1.23-0.92 2.22-0.63 0.98 0.29 1.91 0.9601 2.76999 2.0301l5.48 6.78 13.2998 16.47 18.77-1.57c0.86-0.07 1.79 0.3199 2.77 1.1699 0.99 0.86 1.73 1.9201 2.22 3.1901 0.4 1.03 0.5602 1.98 0.4702 2.85z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg viewBox="-2.9e-6 2e-6 21.3301 25.5931" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 6.605, left: 11.264, overflow: "visible", position: "absolute", top: 16.701, width: 5.505, zIndex: 7 }}>
              <path d="M21.3301 1.24314c-0.46 1.78-0.72 3.75-0.79 5.93l-0.7901 0.4-5.53 2.77-0.8899 0.4399c-0.06 0.03-0.1199 0.07-0.1799 0.11-3.27 1.95-5.01 5.53009-5.21 10.7301l-7.9402 3.97c0.66-0.53 0.9002-1.55 0.7002-3.05-0.12-0.63-0.1801-1.29001-0.1801-1.96001l0-2.1801c0-7.35 2.02-12.56 6.08-15.62999 0.47-0.37 0.97-0.7 1.5-1 3.82-2.17 8.23-2.3499 13.23-0.5299z" fill="#5b5bff" />
              <path d="M21.3301 1.24314c-0.46 1.78-0.72 3.75-0.79 5.93l-0.7901 0.4-5.53 2.77-0.8899 0.4399c-0.06 0.03-0.1199 0.07-0.1799 0.11-3.27 1.95-5.01 5.53009-5.21 10.7301l-7.9402 3.97c0.66-0.53 0.9002-1.55 0.7002-3.05-0.12-0.63-0.1801-1.29001-0.1801-1.96001l0-2.1801c0-7.35 2.02-12.56 6.08-15.62999 0.47-0.37 0.97-0.7 1.5-1 3.82-2.17 8.23-2.3499 13.23-0.5299z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg viewBox="-1e-6 -3.6e-6 84.3299 71.94" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 18.565, left: 4.343, overflow: "visible", position: "absolute", top: 0.55, width: 21.763, zIndex: 8 }}>
              <path d="M84.32988 45.76002l0 14.4401c0 1.27-0.4599 1.9899-1.3899 2.1699l-7.51 3.76-11.6402 5.81c0.36-0.37 0.5401-0.9499 0.5401-1.7399l0-14.4401c0-0.98-0.12991-1.99-0.3899-3.01-0.15-0.59-0.34009-1.1899-0.5801-1.7899-0.49-1.24-1.1199-2.4201-1.8999-3.5401-0.26-0.38-0.5401-0.75-0.8301-1.11l-6.5-8.04-19.3899-24c-0.56-0.68-1.15-1.3-1.76-1.86-0.62-0.57-1.2702-1.0499-1.9402-1.4399-0.68-0.4-1.3099-0.6501-1.8999-0.7801-0.59-0.13-1.19-0.19-1.8-0.19l-9.5999 0.79-16.30003 1.34c-0.39 0.03-0.75008 0.11-1.08008 0.24l-0.03003 0c-0.11 0.05-0.21984 0.1-0.32984 0.16l19.76998-9.87999c0.48-0.29 1.04-0.47002 1.67-0.52002l25.8999-2.13001c0.61 0 1.21 0.06007 1.8 0.19007 0.59 0.13 1.2199 0.38003 1.8999 0.78003 0.67 0.39 1.3202 0.86994 1.9402 1.43994 0.61 0.56 1.2 1.17998 1.76 1.85998l25.8899 32.04c1.17 1.45 2.08 3.0001 2.73001 4.6501 0.65 1.65 0.96999 3.2499 0.96999 4.7999z" fill="#5b5bff" />
              <path d="M84.32988 45.76002l0 14.4401c0 1.27-0.4599 1.9899-1.3899 2.1699l-7.51 3.76-11.6402 5.81c0.36-0.37 0.5401-0.9499 0.5401-1.7399l0-14.4401c0-0.98-0.12991-1.99-0.3899-3.01-0.15-0.59-0.34009-1.1899-0.5801-1.7899-0.49-1.24-1.1199-2.4201-1.8999-3.5401-0.26-0.38-0.5401-0.75-0.8301-1.11l-6.5-8.04-19.3899-24c-0.56-0.68-1.15-1.3-1.76-1.86-0.62-0.57-1.2702-1.0499-1.9402-1.4399-0.68-0.4-1.3099-0.6501-1.8999-0.7801-0.59-0.13-1.19-0.19-1.8-0.19l-9.5999 0.79-16.30003 1.34c-0.39 0.03-0.75008 0.11-1.08008 0.24l-0.03003 0c-0.11 0.05-0.21984 0.1-0.32984 0.16l19.76998-9.87999c0.48-0.29 1.04-0.47002 1.67-0.52002l25.8999-2.13001c0.61 0 1.21 0.06007 1.8 0.19007 0.59 0.13 1.2199 0.38003 1.8999 0.78003 0.67 0.39 1.3202 0.86994 1.9402 1.43994 0.61 0.56 1.2 1.17998 1.76 1.85998l25.8899 32.04c1.17 1.45 2.08 3.0001 2.73001 4.6501 0.65 1.65 0.96999 3.2499 0.96999 4.7999z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <span
            className={`text-sm font-medium tracking-[-0.05em] ${activeTheme === "Dark" ? "text-[#f7f7f7]" : "text-[#696969]"}`}
            style={{ fontFamily: "Geist, var(--font-geist-sans)", fontWeight: 500 }}
          >
            No requests yet
          </span>
          <span
            className={`text-xs tracking-[-0.04em] ${activeTheme === "Dark" ? "text-[#adadad]" : "text-[#939393]"}`}
            style={{ fontFamily: "Geist, var(--font-geist-sans)" }}
          >
            Your log fills in as you explore
          </span>
        </div>
      </div>
        ) : (
          <div className="flex flex-col" style={{ padding: "8px 8px", gap: 16 }}>
            {history.slice(0, 50).map((item, i) => (
              <div key={i} style={{ borderRadius: 6, padding: "6px 8px", cursor: "pointer", backgroundColor: activeTheme === "Dark" ? (i === activeHistoryIndex ? "#0f0f0f" : "#161616") : (i === activeHistoryIndex ? "#ffffff" : "transparent") }} onClick={() => onSelect(item, i)}>
                <div className="flex items-center" style={{ gap: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 6, backgroundColor: activeTheme === "Dark" ? (methodBadgeColors[item.method] ?? methodBadgeColors.GET).darkBg : (methodBadgeColors[item.method] ?? methodBadgeColors.GET).lightBg, padding: "2px 6px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, color: activeTheme === "Dark" ? (methodBadgeColors[item.method] ?? methodBadgeColors.GET).darkText : (methodBadgeColors[item.method] ?? methodBadgeColors.GET).lightText }}>{item.method}</span>
                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, color: activeTheme === "Dark" ? "#f7f7f7" : "#585858", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.url}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 pb-3">
        <ThemeToggle activeTheme={activeTheme} onThemeChange={onThemeChange} />
      </div>
    </div>
  );
}

function ThemeToggle({
  activeTheme,
  onThemeChange,
}: {
  activeTheme: string;
  onThemeChange: (t: string) => void;
}) {
  const isLight = activeTheme === "Light";
  return (
    <motion.div
      animate={{ backgroundColor: activeTheme === "Dark" ? "#262626" : "#f2f2f2" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex w-[140px] items-center gap-2 rounded-xl p-1"
    >
      <motion.button
        onClick={() => onThemeChange("Light")}
        className="flex items-center gap-1"
        animate={{ backgroundColor: isLight ? "#fff" : "#262626" }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ borderRadius: 8, padding: "4px 6px" }}
      >
        <div style={{ height: 16, overflow: "hidden", position: "relative", width: 16 }}>
          <svg viewBox="0 0 8 8" preserveAspectRatio="none" style={{ height: 5.333, left: 5.333, overflow: "visible", position: "absolute", top: 5.333, width: 5.333 }}>
            <path d="M8 4c0 2.20914-1.79086 4-4 4-2.20914 0-4-1.79086-4-4 0-2.20914 1.79086-4 4-4 2.20914 0 4 1.79086 4 4z" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
          <svg viewBox="0 0 1 2" preserveAspectRatio="none" style={{ height: 1.4, left: 8, overflow: "visible", position: "absolute", top: 1.333, width: 1.4 }}>
            <path d="M0 0l0 2" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
          <svg viewBox="0 0 1 2" preserveAspectRatio="none" style={{ height: 1.4, left: 8, overflow: "visible", position: "absolute", top: 13.333, width: 1.4 }}>
            <path d="M0 0l0 2" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
          <svg viewBox="0 0 1.41 1.41" preserveAspectRatio="none" style={{ height: 1.4, left: 3.287, overflow: "visible", position: "absolute", top: 3.287, width: 1.4 }}>
            <path d="M0 0l1.41 1.41" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
          <svg viewBox="0 0 1.41 1.41" preserveAspectRatio="none" style={{ height: 1.4, left: 11.773, overflow: "visible", position: "absolute", top: 11.773, width: 1.4 }}>
            <path d="M0 0l1.41 1.41" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
          <svg viewBox="0 0 2 1" preserveAspectRatio="none" style={{ height: 1.4, left: 1.333, overflow: "visible", position: "absolute", top: 8, width: 1.4 }}>
            <path d="M0 0l2 0" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
          <svg viewBox="0 0 2 1" preserveAspectRatio="none" style={{ height: 1.4, left: 13.333, overflow: "visible", position: "absolute", top: 8, width: 1.4 }}>
            <path d="M0 0l2 0" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
          <svg viewBox="0 0 1.41 1.41" preserveAspectRatio="none" style={{ height: 1.4, left: 3.287, overflow: "visible", position: "absolute", top: 11.773, width: 1.4 }}>
            <path d="M1.41 0l-1.41 1.41" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
          <svg viewBox="0 0 1.41 1.41" preserveAspectRatio="none" style={{ height: 1.4, left: 11.773, overflow: "visible", position: "absolute", top: 3.287, width: 1.4 }}>
            <path d="M1.41 0l-1.41 1.41" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
        </div>
        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.6px", color: isLight ? "#222" : "#818181", transition: "color 0.2s ease" }}>
          Light
        </span>
      </motion.button>
      <motion.button
        onClick={() => onThemeChange("Dark")}
        className="flex items-center"
        animate={{ backgroundColor: isLight ? "rgba(0,0,0,0)" : "#151515" }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ borderRadius: 8, padding: "6px", gap: 4 }}
      >
        <div style={{ height: 16, overflow: "hidden", position: "relative", width: 16 }}>
          <svg viewBox="-1.4e-6 4.4e-6 17.988 17.988" preserveAspectRatio="none" style={{ height: 11.992, left: 1.999, overflow: "visible", position: "absolute", top: 2.009, width: 11.992 }}>
            <path d="M17.98692 9.47273c-0.09372 1.73615-0.68832 3.40798-1.71193 4.8134-1.0236 1.40543-2.43239 2.48427-4.05605 3.10613-1.62366 0.62185-3.3927 0.76009-5.09325 0.398-1.70055-0.36209-3.25982-1.20901-4.48931-2.43837-1.22949-1.22936-2.07657-2.78854-2.43885-4.48906-0.36227-1.70051-0.22422-3.46956 0.39746-5.09329 0.62168-1.62373 1.70038-3.03263 3.1057-4.05638 1.40532-1.02375 3.07709-1.61853 4.81323-1.71243 0.405-0.022 0.617 0.46 0.402 0.803-0.71911 1.15055-1.02703 2.51087-0.87351 3.85895 0.15352 1.34808 0.75943 2.60433 1.71883 3.56373 0.9594 0.9594 2.21565 1.5653 3.56373 1.71882 1.34808 0.15352 2.7084-0.15439 3.85895-0.8735 0.344-0.215 0.825-0.004 0.803 0.401z" fill="none" stroke={isLight ? "#818181" : "#f7f7f7"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />
          </svg>
        </div>
        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isLight ? "#818181" : "#f7f7f7", transition: "color 0.2s ease" }}>
          Dark
        </span>
      </motion.button>
    </motion.div>
  );
}

const demoRequests: Record<string, { method: string; url: string; body?: string }> = {
  "Test a GET": {
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/users/1",
  },
  "Test a POST": {
    method: "POST",
    url: "https://jsonplaceholder.typicode.com/posts",
    body: JSON.stringify(
      {
        title: "Testing API Playground",
        body: "This is a sample post request.",
        userId: 1,
      },
      null,
      2
    ),
  },
  "Simulate an error": {
    method: "GET",
    url: "https://httpstat.us/404",
  },
};

const methodBadgeColors: Record<string, { lightBg: string; lightText: string; darkBg: string; darkText: string }> = {
  GET: { lightBg: "#caffca", lightText: "#008000", darkBg: "#003b00", darkText: "#7ef97e" },
  POST: { lightBg: "#fff0dd", lightText: "#ff8c00", darkBg: "#603500", darkText: "#ffc47d" },
  PUT: { lightBg: "#e2e2ff", lightText: "#6565ff", darkBg: "#00006a", darkText: "#c7c7ff" },
  PATCH: { lightBg: "#ffd5ff", lightText: "#ff25ff", darkBg: "#930093", darkText: "#ffb8ff" },
  DELETE: { lightBg: "#ffdddd", lightText: "#ff4e4e", darkBg: "#7d0000", darkText: "#ffa4a4" },
};

const methodDots: Record<string, string> = { GET: "#008000", POST: "#ff8c00", PUT: "#6565ff", PATCH: "#ff25ff", DELETE: "#ff4e4e" };

function MainContent({
  activeTheme,
  method,
  setMethod,
  url,
  setUrl,
  headerKey,
  setHeaderKey,
  headerBearer,
  setHeaderBearer,
  headerValue,
  setHeaderValue,
  response,
  loading,
  onSend,
  responseKey,
  headersFilter,
  setHeadersFilter,
  history,
  activeHistoryIndex,
  onHistorySelect,
}: {
  activeTheme: string;
  method: string;
  setMethod: (m: string) => void;
  url: string;
  setUrl: (u: string) => void;
  headerKey: string;
  setHeaderKey: (v: string) => void;
  headerBearer: string;
  setHeaderBearer: (v: string) => void;
  headerValue: string;
  setHeaderValue: (v: string) => void;
  response: any;
  loading: boolean;
  onSend: (opts?: { method?: string; url?: string; headers?: Record<string, string> }) => void;
  responseKey: number;
  headersFilter: string;
  setHeadersFilter: (v: string) => void;
  history: any[];
  activeHistoryIndex: number | null;
  onHistorySelect: (item: any, index: number) => void;
}) {
  const isDark = activeTheme === "Dark";
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const todayKey = new Date().toDateString();
  const isTodayItem = (t: number) => new Date(t).toDateString() === todayKey;
  const recentHistory = history.slice(0, 50);
  const hasOlderHistory = recentHistory.some((item) => !isTodayItem(item.timestamp));
  const todayRows = recentHistory.filter((item) => isTodayItem(item.timestamp)).length;
  const olderRows = recentHistory.length - todayRows;
  const modalHeight =
    history.length === 0
      ? 413
      : Math.min(413, 67 + 16 + (todayRows ? 12 + todayRows * 38 + (todayRows - 1) * 12 : 0) + (hasOlderHistory ? 16 + 12 + olderRows * 38 + (olderRows - 1) * 12 : 0) + 16);
  const renderHistoryRow = (item: any, i: number) => (
    <div key={i} className="flex items-center" style={{ gap: 8, borderRadius: 6, padding: "10px 16px", cursor: "pointer", backgroundColor: isDark ? (hoveredRow === i ? "#1f1f1f" : "#0f0f0f") : (hoveredRow === i ? "#f7f7f7" : "#ffffff") }} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} onClick={() => { setShowHistory(false); onHistorySelect(item, i); }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: methodDots[item.method] ?? "#008000", flexShrink: 0 }} />
      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.7px", color: isDark ? (hoveredRow === i ? "#f7f7f7" : "#adadad") : "#636363", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.url}</span>
    </div>
  );
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissedCheatSheet, setDismissedCheatSheet] = useState(false);
  const [expandedHeaders, setExpandedHeaders] = useState<Record<string, boolean>>({});
  const [headersCollapsed, setHeadersCollapsed] = useState(false);
  const resultContentRef = useRef<HTMLDivElement>(null);
  const [resultHeight, setResultHeight] = useState<number | "auto">("auto");
  useEffect(() => {
    if (headerExpanded && !dismissedCheatSheet) setShowCheatSheet(true);
    if (!headerExpanded) setShowCheatSheet(false);
  }, [headerExpanded, dismissedCheatSheet]);
  useLayoutEffect(() => {
    if (resultContentRef.current) {
      setResultHeight(resultContentRef.current.scrollHeight);
    }
  }, [headersFilter, response, headersCollapsed]);
  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        marginLeft: 32,
        marginRight: 32,
        marginTop: 32,
        marginBottom: 32,
        backgroundColor: isDark ? "#1b1b1b" : "#f5f5f5",
        border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2",
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="flex flex-1 flex-col items-center" style={{ flexShrink: 0 }}>
        {!response && !loading && (
          <div className="flex flex-1 flex-col" style={{ maxWidth: 574 }}>
          <motion.div
            className="flex-1 overflow-y-auto flex flex-col items-center justify-center"
            style={{ minHeight: 0 }}
            variants={{
              hidden: { opacity: 1 },
              visible: { opacity: 1 },
            }}
            initial="hidden"
            animate="visible"
          >
          {!response && !loading && (<> 
          <motion.div
            className="relative shrink-0"
            initial={false}
            animate={{ height: headerExpanded ? 340 : 193 }}
            transition={headersPanelTransition}
            style={{
              width: 574,
              backgroundColor: isDark ? "#161616" : "#fcfcfc",
              ...(isDark ? {} : { border: "0.8px solid #f2f2f2" }),
              borderRadius: 10,
            }}
          >
            <motion.div initial="hidden" animate="visible" variants={cardContentVariants}>
            <motion.div variants={cardItemVariants}>
              <h1
                className="absolute"
                style={{
                  left: 192,
                  top: 32,
                  fontFamily: "Geist, var(--font-geist-sans)",
                  fontSize: 24,
                  fontWeight: 500,
                  letterSpacing: "-1.2px",
                  color: isDark ? "#ffffff" : "#222",
                }}
              >
                Welcome, Explorer
              </h1>
            </motion.div>

            <motion.div variants={cardItemVariants}>
              <div className="absolute" style={{ left: 54, top: 75, width: 467, height: 52 }}>
                <UrlInputBar activeTheme={activeTheme} method={method} setMethod={setMethod} url={url} setUrl={setUrl} loading={loading} onSend={onSend} />
              </div>
            </motion.div>

            {!headerExpanded && (
              <motion.div
                variants={cardItemVariants}
                className="absolute flex items-center"
                style={{ left: 222, top: 143, gap: 16, cursor: "pointer" }}
                onClick={() => setHeaderExpanded(true)}
              >
                <div className="flex items-center" style={{ gap: 4 }}>
          <svg width="16" height="16" viewBox="0 0 25 25" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M12.0369 8.71262C12.4511 8.71262 12.7869 9.0484 12.7869 9.46262V16.611C12.7869 17.0253 12.4511 17.361 12.0369 17.361C11.6227 17.361 11.2869 17.0253 11.2869 16.611V9.46262C11.2869 9.0484 11.6227 8.71262 12.0369 8.71262Z" fill="#5B5BFF" />
            <path fillRule="evenodd" clipRule="evenodd" d="M7.70886 13.0368C7.70886 12.6226 8.04465 12.2868 8.45886 12.2868H15.6147C16.0289 12.2868 16.3647 12.6226 16.3647 13.0368C16.3647 13.451 16.0289 13.7868 15.6147 13.7868H8.45886C8.04465 13.7868 7.70886 13.451 7.70886 13.0368Z" fill="#5B5BFF" />
            <path fillRule="evenodd" clipRule="evenodd" d="M4.96051 5.96045C3.66147 7.25949 3.05005 9.42738 3.05005 13.0368C3.05005 16.6463 3.66147 18.8142 4.96051 20.1132C6.25956 21.4123 8.42744 22.0237 12.0369 22.0237C15.6463 22.0237 17.8142 21.4123 19.1133 20.1132C20.4123 18.8142 21.0237 16.6463 21.0237 13.0368C21.0237 9.42738 20.4123 7.25949 19.1133 5.96045C17.8142 4.6614 15.6463 4.04999 12.0369 4.04999C8.42744 4.04999 6.25956 4.6614 4.96051 5.96045ZM3.89985 4.89979C5.6437 3.15594 8.34424 2.54999 12.0369 2.54999C15.7295 2.54999 18.4301 3.15594 20.1739 4.89979C21.9178 6.64364 22.5237 9.34418 22.5237 13.0368C22.5237 16.7295 21.9178 19.43 20.1739 21.1739C18.4301 22.9177 15.7295 23.5237 12.0369 23.5237C8.34424 23.5237 5.6437 22.9177 3.89985 21.1739C2.156 19.43 1.55005 16.7295 1.55005 13.0368C1.55005 9.34418 2.156 6.64364 3.89985 4.89979Z" fill="#5B5BFF" />
          </svg>
                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.56px", color: "#5b5bff" }}>
                    Header
                  </span>
                </div>
                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.56px", color: "#9e9e9e" }}>
                  Optional
                </span>
              </motion.div>
            )}
            </motion.div>

            <AnimatePresence>
              {headerExpanded && (<>
                <motion.div
                  key="headers-panel"
                  className="absolute"
                  style={{
                    left: 54,
                    top: 143,
                    width: 467,
                    overflow: "hidden",
                  }}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={headersPanelTransition}
                >
                  <div
                    style={{
                      borderRadius: 6,
                      backgroundColor: isDark ? "#0f0f0f" : "#fcfcfc",
                      border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2",
                    }}
                  >
                    <div className="flex items-center" style={{ height: 44, paddingLeft: 16, paddingRight: 16 }}>
                      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858" }}>
                        Headers
                      </span>
                      <div style={{ position: "relative", display: "inline-flex" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 8, cursor: "pointer" }} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
                          <circle cx="8" cy="8" r="6.667" stroke="#9e9e9e" strokeWidth="1.4" />
                          <path d="M8 5.333v2.667" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />
                          <circle cx="8" cy="11" r="0.5" fill="#9e9e9e" />
                        </svg>
                        <AnimatePresence>
                          {showTooltip && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
                              style={{
                                position: "absolute",
                                left: -2,
                                top: 20,
                                width: 220,
                                backgroundColor: isDark ? "#0f0f0f" : "#fff",
                                borderRadius: 6,
                                boxShadow: isDark ? "0 12px 14px rgba(61,61,61,0.5)" : "0 12px 14px rgba(219,219,219,0.5)",
                                zIndex: 60,
                                padding: "12px 12px",
                              }}
                            >
                              <div style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: isDark ? "#f7f7f7" : "#616161" }}>Authorization: Bearer sk-abc123</div>
                              <div style={{ marginTop: 12, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#adadad" : "#9e9e9e" }}>Proves who you are ( Authorization ), using a token-based method ( Bearer ), with your secret key (sk-abc123)</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="ml-auto flex items-center" style={{ gap: 4 }}>
                        <div style={{ width: 15, height: 16 }}>
                          <svg width="15" height="16" viewBox="0 0 15 16">
                            <g transform="translate(0.969, 1.952) scale(0.729, 0.747)">
                              <path transform="translate(-1.5, -1.5)" d="M3.41046 3.41046c-1.29904 1.29904-1.91046 3.46693-1.91046 7.07635 0 3.6095 0.61142 5.7774 1.91046 7.0764 1.29905 1.2991 3.46693 1.9105 7.07639 1.9105 3.6094 0 5.7773-0.6114 7.0764-1.9105 1.299-1.299 1.9104-3.4669 1.9104-7.0764 0-3.60942-0.6114-5.77731-1.9104-7.07635-1.2991-1.29905-3.467-1.91046-7.0764-1.91046-3.60946 0-5.77734 0.61141-7.07639 1.91046z m-1.06066-1.06066c1.74385-1.74385 4.44439-2.3498 8.13705-2.3498 3.6926 0 6.3932 0.60595 8.137 2.3498 1.7439 1.74385 2.3498 4.44439 2.3498 8.13701 0 3.6927-0.6059 6.3932-2.3498 8.1371-1.7438 1.7438-4.4444 2.3498-8.137 2.3498-3.69266 0-6.3932-0.606-8.13705-2.3498-1.74385-1.7439-2.3498-4.4444-2.3498-8.1371 0-3.69262 0.60595-6.39316 2.3498-8.13701z" fill="#5b5bff" fillRule="evenodd" />
                            </g>
                            <g transform="translate(7.054, 5.896) scale(0.625, 0.64)">
                              <path d="M0.75 0c0.4142 0 0.75 0.33578 0.75 0.75l0 7.14838c0 0.4143-0.3358 0.75-0.75 0.75-0.4142 0-0.75-0.3357-0.75-0.75l0-7.14838c0-0.41422 0.3358-0.75 0.75-0.75z" fill="#5b5bff" fillRule="evenodd" />
                            </g>
                            <g transform="translate(4.818, 8.184) scale(0.625, 0.64)">
                              <path d="M0 0.75c0-0.4142 0.33579-0.75 0.75-0.75l7.15584 0c0.4142 0 0.75 0.3358 0.75 0.75 0 0.4142-0.3358 0.75-0.75 0.75l-7.15584 0c-0.41421 0-0.75-0.3358-0.75-0.75z" fill="#5b5bff" fillRule="evenodd" />
                            </g>
                          </svg>
                        </div>
                        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: "#5b5bff" }}>
                          Add header
                        </span>
                        <div style={{ display: "flex", alignItems: "center", borderRadius: 6, backgroundColor: isDark ? "#1c1c1c" : "#e8e8e8", padding: "2px 4px" }}>
                          <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#d1d1d1" : "#4d4d4d", textAlign: "center" }}>
                            Coming soon
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex" style={{ gap: 16, padding: "0 12px 12px" }}>
                      <div className="flex flex-col" style={{ gap: 16, width: 203 }}>
                        <div style={{ borderRadius: 8, backgroundColor: isDark ? "#0c0c0c" : "#fafafa", border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", padding: "12px 123px 12px 12px", height: 40, display: "flex", alignItems: "center" }}>
                          <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#8c8c8c" : "#5b5b5b" }}>
                            Authorization
                          </span>
                        </div>
                        <div style={{ borderRadius: 8, backgroundColor: isDark ? "#212121" : "#fff", border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", padding: "12px 171px 12px 12px", minHeight: 40, position: "relative" }}>
                          <input type="text" placeholder="Key" value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} className="placeholder:text-[#6e6d6d]" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: "0 12px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#c7c7c7" : "#6e6d6d", border: "none", outline: "none", background: "transparent", overflow: "hidden" }} />
                        </div>
                      </div>
                      <div className="flex flex-col" style={{ gap: 16, width: 216 }}>
                        <div style={{ borderRadius: 8, backgroundColor: isDark ? "#212121" : "#fff", border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", padding: "12px 123px 12px 12px", minHeight: 40, position: "relative" }}>
                          <input type="text" placeholder="Bearer SK-____" value={headerBearer} onChange={(e) => setHeaderBearer(e.target.value)} className="placeholder:text-[#6e6d6d]" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: "0 12px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#c7c7c7" : "#6e6d6d", border: "none", outline: "none", background: "transparent", whiteSpace: "nowrap", overflow: "hidden" }} />
                        </div>
                        <div style={{ borderRadius: 8, backgroundColor: isDark ? "#212121" : "#fff", border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", padding: "12px 175px 12px 12px", minHeight: 40, position: "relative" }}>
                          <input type="text" placeholder="Value" value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} className="placeholder:text-[#6e6d6d]" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: "0 12px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#c7c7c7" : "#6e6d6d", border: "none", outline: "none", background: "transparent", overflow: "hidden" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  key="cancel-button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.05, duration: 0.15 }}
                >
                  <div
                    className="absolute cursor-pointer"
                    style={{ right: 45, top: 137 }}
                    onClick={() => setHeaderExpanded(false)}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="7.5" stroke="#9e9e9e" strokeWidth="1.4" />
                      <path d="M6 6l6 6M12 6l-6 6" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </div>
                </motion.div>
              </>)}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={cardItemVariants} className="mt-6 flex items-center" style={{ gap: 16 }}>
            {["Test a GET", "Test a POST", "Simulate an error", "View history"].map((label) => (
              <button
                key={label}
                onClick={() => {
                  const demo = demoRequests[label];
                  if (demo) {
                    setMethod(demo.method);
                    setUrl(demo.url);
                    onSend({ method: demo.method, url: demo.url });
                  } else if (label === "View history") {
                    setShowHistory((v) => !v);
                  }
                }}
                className={`flex items-center justify-center px-2 py-1.5 text-xs font-medium tracking-[-0.04em] ${isDark ? "" : "bg-white text-[#5a5a5a] hover:bg-gray-50"}`}
                style={{
                  borderRadius: 6,
                  boxShadow: isDark ? "inset 0 0 0 0.8px #202020" : "inset 0 0 0 0.8px #f2f2f2",
                  fontFamily: "Geist, var(--font-geist-sans)",
                  fontWeight: 500,
                  ...(isDark ? { backgroundColor: "#0f0f0f", color: "#8c8c8c" } : {}),
                }}
              >
                {label}
              </button>
            ))}
          </motion.div>
          </>)}
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showHistory && (
          <motion.div
            key="history-glass"
            className="fixed inset-0"
            style={{
              zIndex: 50,
              pointerEvents: "auto",
              backdropFilter: "blur(36.75px)",
              WebkitBackdropFilter: "blur(36.75px)",
              background:
                isDark
                  ? "linear-gradient(-23.5deg, rgba(36, 36, 36, 0.47), rgba(129, 129, 129, 0))"
                  : "linear-gradient(-23.5deg, rgba(180, 180, 180, 0.47), rgba(230, 230, 230, 0))",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showHistory && (
          <motion.div
            key="history-panel"
            className="fixed"
            style={{
              left: "calc(50% - 286.5px)",
              top: `calc(50% - ${modalHeight / 2}px)`,
              zIndex: 60,
              width: 573,
              height: modalHeight,
              backgroundColor: isDark ? "#0f0f0f" : "#ffffff",
              ...(isDark ? {} : { border: "0.8px solid #f2f2f2" }),
              borderRadius: 10,
            }}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.97 }}
            variants={cardContentVariants}
          >
            <motion.div variants={cardItemVariants}>
              <div className="absolute flex items-center" style={{ left: 16, top: 16, gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="8.825" cy="8.825" r="6.741" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.514 13.864l2.643 2.636" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, letterSpacing: "-0.8px", color: "#999999" }}>Search....</span>
              </div>
              <svg className="absolute" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ right: 16, top: 17, cursor: "pointer" }} onClick={() => setShowHistory(false)}>
                <circle cx="9" cy="9" r="7.5" stroke="#9e9e9e" strokeWidth="1.4" />
                <path d="M6 6l6 6M12 6l-6 6" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <div className="absolute" style={{ left: 16, top: 51, right: 16, height: 0.8, backgroundColor: isDark ? "#2d2d2d" : "#f2f2f2" }} />
            </motion.div>
            <motion.div variants={cardItemVariants}>
              <div className="hide-scrollbar" style={{ position: "absolute", left: 16, top: 67, right: 16, bottom: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                {history.length === 0 ? (
                  <div className="flex flex-col items-center" style={{ gap: 12, paddingTop: 66 }}>
                    <img src="/history-empty.png" alt="" style={{ width: 70, height: 70 }} />
                    <div className="flex flex-col items-center" style={{ gap: 8 }}>
                      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isDark ? "#f7f7f7" : "#696969" }}>No requests yet</span>
                      <span style={{ width: 280, textAlign: "center", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.56px", lineHeight: "20px", color: isDark ? "#adadad" : "#939393" }}>Try one of the demo buttons above, or send your first request.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858" }}>Today</span>
                    {recentHistory.map((item, i) => (isTodayItem(item.timestamp) ? renderHistoryRow(item, i) : null))}
                    {hasOlderHistory && (
                      <>
                        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858" }}>Previous 30 days</span>
                        {recentHistory.map((item, i) => (!isTodayItem(item.timestamp) ? renderHistoryRow(item, i) : null))}
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

          {(loading || response) && (
          <>
          <div className="hide-scrollbar" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 76, overflowY: "scroll", overflowX: "hidden", paddingBottom: 100 }}>
            <div className="flex items-center" style={{ marginRight: 24, marginTop: 24, marginLeft: "auto", width: "fit-content", maxWidth: "calc(100% - 48px)", minHeight: 50, borderRadius: 10, backgroundColor: isDark ? "#0f0f0f" : "#fcfcfc", gap: 4, padding: "0 16px", boxSizing: "border-box" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: isDark ? "#00bf00" : "#008000" }} />
                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: isDark ? "#ffffff" : "#5a5a5a" }}>{method}</span>
                <span style={{ display: "block", maxWidth: 520, whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: isDark ? "#d1d1d1" : "#767676" }}>{url || "/v1/nodes/status"}</span>
              </div>
            <div className="flex items-center" style={{ marginRight: 24, marginTop: 12, marginLeft: "auto", gap: 8, cursor: "pointer", width: "fit-content" }}>
              <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 2, top: 2, width: 12, height: 11.629 }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: 12, height: 11.629 }}>
                    <svg viewBox="0 0 7.2526 1" preserveAspectRatio="none" style={{ position: "absolute", left: 7.165, top: 11.629, width: 4.835, height: 1.4, overflow: "visible" }}>
                      <path d="M0 0l7.2526 0" fill="none" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <svg viewBox="-0.0000015757977962493896 -0.000005125999450683594 15.679938938468695 17.44302499294281" preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0, width: 10.453, height: 11.629, overflow: "visible" }}>
                      <path d="M9.78001 0.79479c0.77564-0.92701 2.16998-1.06294 3.11622-0.30306 0.05232 0.04123 1.73325 1.34706 1.73325 1.34706 1.0395 0.6284 1.36249 1.96432 0.71991 2.9838-0.03412 0.0546-9.53745 11.94189-9.53744 11.94189-0.31617 0.39442-0.79611 0.62729-1.30904 0.63286l-3.63938 0.04568-0.82-3.47071c-0.11487-0.48802 0-1.00054 0.31617-1.39496l9.42031-11.78256z" fill="none" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <svg viewBox="0 0 5.45224 4.18713" preserveAspectRatio="none" style={{ position: "absolute", left: 5.347, top: 2.001, width: 3.635, height: 2.791, overflow: "visible" }}>
                      <path d="M0 0l5.45224 4.18713" fill="none" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 400, color: "#9e9e9e", letterSpacing: "-0.7px", whiteSpace: "nowrap" }}>Edit</span>
            </div>
            <motion.div
              animate={{ height: resultHeight }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ marginLeft: 24, marginTop: 14, maxWidth: 787, borderRadius: 10, backgroundColor: isDark ? "#0f0f0f" : "#fcfcfc", overflowWrap: "break-word", wordBreak: "break-word", overflow: "hidden" }}>
              <div ref={resultContentRef}>
              {!response ? (
                <div style={{ padding: 16 }}>
                  <LoadingState label="Sending" variant="Drive" dark={isDark} />
                </div>
              ) : (
                <>
                <motion.div
                className="flex items-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.1 }}
                style={{ padding: "16px", gap: 12 }}
              >
                {response.error ? (
                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, color: "#dc143c" }}>Error</span>
                ) : (
                  <>
                    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 6, backgroundColor: "#caffca", padding: "4px 8px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: response.status >= 200 && response.status < 300 ? "#008000" : "#dc143c" }}>{response.status}</span>
                    <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: isDark ? "#9e9e9e" : "#585858" }}>{response.time}ms</span>
                    <div className="flex items-center" style={{ marginLeft: "auto" }}>
                      <div onClick={() => setHeadersFilter("common")} style={{ width: 53, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", color: headersFilter === "common" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>Common</span>
                        <div style={{ width: "100%", height: 0, borderTop: headersFilter === "common" ? (isDark ? "1px solid #ffffff" : "1px solid #000") : (isDark ? "1px solid #1b1b1b" : "1px solid #fcfcfc") }} />
                      </div>
                      <div onClick={() => setHeadersFilter("all")} style={{ width: 53, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", color: headersFilter === "all" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>All</span>
                        <div style={{ width: "100%", height: 0, borderTop: headersFilter === "all" ? (isDark ? "1px solid #ffffff" : "1px solid #000") : (isDark ? "1px solid #1b1b1b" : "1px solid #fcfcfc") }} />
                      </div>
                    </div>
                  </>
                )}
                {response.error && <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 11, color: "#9e9e9e" }}>{response.error}</span>}
              </motion.div>
              <div style={{ height: 0, borderTop: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2" }} />
              {!response.error && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } },
                  }}
                  style={{ padding: "12px" }}
                >
                  <div className="flex items-center" style={{ gap: 8, marginLeft: 16, cursor: "pointer" }} onClick={() => setHeadersCollapsed(!headersCollapsed)}>
                    <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, color: isDark ? "#ffffff" : "#585858" }}>Response Headers</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: headersCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                      <path d="M4 6l4 4 4-4" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
<motion.div
                  initial={false}
                  animate={{ height: headersCollapsed ? 0 : "auto", opacity: headersCollapsed ? 0 : 1 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  {response.headers && Object.keys(response.headers).length > 0 && (
                    <>
                      {(() => {
                        const entries = Object.entries(response.headers).slice(0, 20);
                        const filtered = headersFilter === "common"
                          ? entries.filter(([k]) => commonKeys.includes(k.toLowerCase()))
                          : entries;
                        if (filtered.length === 0) {
                          return null;
                        }
                        return (
                          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 24 }}>
                            {(() => {
                              function parseStructured(val: string): { key: string; value: string }[] | null {
                                try {
                                  const parsed = JSON.parse(val);
                                  if (typeof parsed === "object" && parsed !== null) {
                                    return Object.entries(parsed).map(([k, v]) => ({ key: k, value: typeof v === "object" ? JSON.stringify(v) : String(v) }));
                                  }
                                } catch {}
                                const qIdx = val.indexOf("?");
                                if (qIdx !== -1 && qIdx < val.length - 1) {
                                  try {
                                    const qs = val.substring(qIdx + 1);
                                    const params = new URLSearchParams(qs);
                                    const entries: { key: string; value: string }[] = [];
                                    params.forEach((v, k) => entries.push({ key: k, value: v }));
                                    if (entries.length > 0) return entries;
                                  } catch {}
                                }
                                if (val.includes("=") && (val.includes(",") || val.includes(" "))) {
                                  const parts = val.split(",").map(s => s.trim()).filter(Boolean);
                                  const entries: { key: string; value: string }[] = [];
                                  for (const part of parts) {
                                    const eqIdx = part.indexOf("=");
                                    if (eqIdx !== -1) entries.push({ key: part.substring(0, eqIdx).trim(), value: part.substring(eqIdx + 1).trim() });
                                  }
                                  if (entries.length > 0) return entries;
                                }
                                return null;
                              }
                              return filtered.map(([k, v]) => {
                              const lk = k.toLowerCase();
                              const extraSpace = lk === "nel" ? 36 : lk === "report" || lk === "reporting-endpoint" || lk === "report-to" || lk === "reporting-endpoints" ? 24 : 0;
                              const isLong = (v as string).length > 60;
                              const isExpanded = expandedHeaders[k];
                              const parsed = lk === "report-to" && headersFilter === "all" ? parseStructured(v as string) : null;
                              const displayVal = isLong && !isExpanded ? (v as string).substring(0, 60) + "..." : v as string;
                              return (
                              <motion.div
                                key={k}
                                variants={{
                                  hidden: { opacity: 0, y: 6 },
                                  visible: { opacity: 1, y: 0 },
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                style={{ display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)", columnGap: 40, alignItems: "start", marginLeft: 16 }}
                              >
                                <span style={{ flexShrink: 0, marginRight: 24 + extraSpace, whiteSpace: "nowrap", overflowWrap: "normal", wordBreak: "normal", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 400, color: "#9e9e9e" }}>{k}</span>
                                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 400, color: isDark ? "#c7c7c7" : "#4a4a4a", wordBreak: "break-word", paddingRight: 16 }}>
                                  <div style={{ textAlign: "left", maxWidth: "72%" }}>
                                    {parsed && isExpanded ? (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", alignItems: "baseline", fontSize: 14, color: "#6a6a6a" }}>
                                        {parsed.map(p => (
                                          <span key={p.key}>
                                            <span style={{ fontWeight: 500, color: "#9e9e9e" }}>{p.key}:</span>
                                            <span style={{ wordBreak: "break-word" }}> {p.value}</span>
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span>{displayVal}</span>
                                    )}
                                  </div>
                                  {isLong && headersFilter === "all" && (
                                    <span onClick={() => setExpandedHeaders(p => ({ ...p, [k]: !isExpanded }))} style={{ cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 6l4 4 4-4" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                              );
                            })})()}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </motion.div>
                </motion.div>
              )}
              {!response.error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 26, delay: 0.28 }}
                  style={{ padding: "12px" }}
                >
                  <BodyViewer body={response.body} isDark={isDark} />
                </motion.div>
              )}
                </>
              )}
              </div>
            </motion.div>
            <div className="flex items-center" style={{ marginLeft: 24, marginTop: 12, gap: 8, cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 0110.465-4" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.333 1.333V4H11" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 8a6 6 0 01-10.465 4" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2.667 14.667V12H5" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: "#9e9e9e" }}>Retry</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10, padding: "0 0 4px", display: "flex", justifyContent: "center", background: "transparent", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderTop: "none" }}>
            <UrlInputBar activeTheme={activeTheme} method={method} setMethod={setMethod} url={url} setUrl={setUrl} loading={loading} onSend={onSend} />
          </div>
          </>
          )}

      {!response && !loading && (
      <p
        className={`mb-4 text-xs tracking-[-0.04em] ${isDark ? "text-white" : "text-[#939393]"}`}
        style={{ fontFamily: "Geist, var(--font-geist-sans)" }}
      >
        Lightweight API testing
      </p>
      )}



      <AnimatePresence>
      {showCheatSheet && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 350, damping: 26, mass: 0.7 }}
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            width: 297,
            height: 339,
            backgroundColor: isDark ? "#0f0f0f" : "#fff",
            borderRadius: 10,
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: 297, height: 64, background: "url('/cheat sheet rectangle.png') center/cover no-repeat" }} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{ position: "absolute", left: 260.84, top: 6.97, width: 24, height: 25, cursor: "pointer" }}
            onClick={() => { setShowCheatSheet(false); setDismissedCheatSheet(true); }}
          >
            <svg width="19.5" height="19.5" viewBox="0 0 19.5 19.5" style={{ position: "absolute", left: 2.5, top: 3.28 }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M13.211 12.13903l-1.061 1.061-2.401-2.399-2.4 2.396-1.06-1.061 2.399-2.395-2.399-2.398 1.061-1.06103 2.4 2.39903 2.401-2.39703 1.06 1.06203-2.4 2.395 2.4 2.398z m-3.461-12.13903c-5.376 0-9.75 4.374-9.75 9.75003 0 5.376 4.374 9.75 9.75 9.75 5.376 0 9.75-4.374 9.75-9.75 0-5.37603-4.374-9.75003-9.75-9.75003z" fill="#fff" />
            </svg>
          </motion.div>
          <span style={{ position: "absolute", left: 12, top: 76, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.8px", color: isDark ? "#f7f7f7" : "#616161" }}>cheat sheet</span>
          <motion.div
            variants={{ visible: { transition: { staggerChildren: 0.02, delayChildren: 0.08 } } }}
            initial="hidden"
            animate="visible"
            style={{ position: "absolute", left: 12, top: 109, width: 273, height: 218, borderRadius: 8, border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#0f0f0f" : "#fff" }}
          >
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 12, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.4px", color: isDark ? "#e4e4e4" : "#737373" }}>Headers -</motion.span>
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 67, top: 12, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>What they are, why servers care</motion.span>
            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 36, width: 249, height: 1, backgroundColor: isDark ? "#312f2f" : "#f2f2f2" }} />
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 45, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.4px", color: isDark ? "#e4e4e4" : "#737373" }}>Authorization -</motion.span>
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 94, top: 45, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>The specific header that gates</motion.span>
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 65, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>access on most API</motion.span>
            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 89, width: 249, height: 1, backgroundColor: isDark ? "#312f2f" : "#f2f2f2" }} />
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 97, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.4px", color: isDark ? "#e4e4e4" : "#737373" }}>Bearer Token -</motion.span>
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 92, top: 97, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>why it's just a string, no password</motion.span>
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 13, top: 117, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>flow</motion.span>
            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 141, width: 249, height: 1, backgroundColor: isDark ? "#312f2f" : "#f2f2f2" }} />
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 149, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.4px", color: isDark ? "#e4e4e4" : "#737373" }}>API key/ SL prefix -</motion.span>
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 117, top: 149, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>treat-it- like a password</motion.span>
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 169, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>framing since this is a real security habit worth</motion.span>
            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 190, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>planting early</motion.span>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

    </div>
    </div>
  );
}

function UrlInputBar({
  activeTheme,
  method,
  setMethod,
  url,
  setUrl,
  loading,
  onSend,
}: {
  activeTheme: string;
  method: string;
  setMethod: (m: string) => void;
  url: string;
  setUrl: (u: string) => void;
  loading: boolean;
  onSend: (opts?: { method?: string; url?: string; headers?: Record<string, string> }) => void;
}) {
  const isDark = activeTheme === "Dark";
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredMethod, setHoveredMethod] = useState("GET");
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const popupContent: Record<string, { title: string; status: string; rows: [string, string, string, string][]; jsonLabel: boolean; label: string; description: string; description2: string }> = {
    GET: {
      title: "/api/users/1",
      status: "200",
      rows: [
        ["\u201Cid\u201D", ":", "1", ","],
        ["\u201Cname\u201D", ":", "\u201CAda lovelace\u201D", ","],
        ["\u201Cemail\u201D", ":", "\u201Cada@x.com\u201D", ","],
      ],
      jsonLabel: false,
      label: "GET",
      description: "Retrieve data from a resource without changing anything.",
      description2: "",
    },
    POST: {
      title: "POST",
      status: "201 Created",
      rows: [
        ["\u201Cid\u201D", ":", "2", ","],
        ["\u201Cname\u201D", ":", "\u201CGrace Hopper\u201D", ","],
        ["\u201Cemail\u201D", ":", "\u201Cgrace@x.com\u201D", ","],
      ],
      jsonLabel: true,
      label: "POST",
      description: "Create a new resource with the data",
      description2: "you send.",
    },
    PUT: {
      title: "PUT",
      status: "200 OK",
      rows: [
        ["\u201Cid\u201D", ":", "1", ","],
        ["\u201Cname\u201D", ":", "\u201CAda Lovelace\u201D", ","],
        ["\u201Cemail\u201D", ":", "\u201Cada@newmail.com\u201D", ","],
      ],
      jsonLabel: true,
      label: "PUT",
      description: "Replace a resource completely with new data.",
      description2: "",
    },
    PATCH: {
      title: "PATCH",
      status: "200 OK",
      rows: [
        ["\u201Cid\u201D", ":", "1", ","],
        ["\u201Cemail\u201D", ":", "\u201Cada@newmail.com\u201D", ","],
      ],
      jsonLabel: true,
      label: "PATCH",
      description: "Update part of a resource without replacing the rest.",
      description2: "",
    },
    DELETE: {
      title: "DELETE",
      status: "204 No Content",
      rows: [],
      jsonLabel: true,
      label: "DELETE",
      description: "Remove a resource permanently.",
      description2: "",
    },
  };
  const content = popupContent[hoveredMethod] ?? popupContent.GET;
  const isGetCode = content === popupContent.GET;
  const keyColor = isGetCode ? (isDark ? "#5bbbe8" : "#0396dc") : (isDark ? "#e9a5aa" : "#d07279");
  const numColor = isGetCode ? (isDark ? "#bd766a" : "#992c1a") : (isDark ? "#75d5d5" : "#2fb4b4");
  const [localUrl, setLocalUrl] = useState(url);
  useEffect(() => { setLocalUrl(url); }, [url]);

  return (
    <div
      className="relative flex w-[467px] items-center gap-4 rounded-lg p-3"
      style={{
        border: isDark ? "0.8px solid #2a2a2a" : "0.8px solid #f2f2f2",
        borderRadius: 8,
        backgroundColor: isDark ? "#121212" : "#ffffff",
      }}
    >
      <div className="relative">
        <button
          onClick={() => { setShowDropdown(!showDropdown); setHoveredMethod(method); }}
          className="flex items-center gap-1 px-2 py-1.5"
          style={{ border: isDark ? "0.8px solid #2a2a2a" : "0.8px solid #f2f2f2", borderRadius: 6, backgroundColor: isDark ? "#1f1f1f" : "#fcfcfc" }}
        >
          <span className={`flex items-center gap-1 text-xs ${isDark ? "text-white" : "text-[#5a5a5a]"}`}>
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: methodDots[method] }} />
            {method}
          </span>
          <motion.svg
            width="17"
            height="16"
            viewBox="0 0 17 16"
            fill="none"
            animate={{ rotate: showDropdown ? 180 : 0 }}
            transition={cardTextSpring}
            style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
          >
            <path d="M4 6l6 6 6-6" stroke="#5a5a5a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </button>
        <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="absolute z-10"
            onMouseLeave={() => setHoveredMethod(method)}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
            style={{
              left: -20,
              top: "calc(100% + 18px)",
              width: 471,
              height: 250,
              borderRadius: 8,
              backgroundColor: isDark ? "#0f0f0f" : "#ffffff",
              border: isDark ? "0.8px solid #312f2f" : "none",
              boxShadow: isDark ? "0 12px 14px rgba(61, 61, 61, 0.5)" : "0 12px 14px rgba(219, 219, 219, 0.30)",
            }}
          >
            {methods.map((m, i) => (
              <button
                key={m}
                onClick={() => {
                  setMethod(m);
                  setShowDropdown(false);
                }}
                onMouseEnter={() => setHoveredMethod(m)}
                style={{
                  position: "absolute",
                  left: 16,
                  top: 16 + i * 44,
                  width: 190,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "8px 12px",
                  borderRadius: 6,
                  backgroundColor: hoveredMethod === m ? (isDark ? "#1f1f1f" : "#f7f7f7") : "transparent",
                }}
              >
                <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: methodDots[m], flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "-0.48px", color: isDark ? "#d1d1d1" : "#5a5a5a", fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{m}</span>
              </button>
            ))}
            <div style={{ position: "absolute", left: 214, top: 16, width: 0.8, height: 218, backgroundColor: isDark ? "#2d2d2d" : "#f2f2f2" }} />
            <div style={{ position: "absolute", left: 223, top: 16, width: 232, height: 160, borderRadius: 6, backgroundColor: isDark ? "#1b1b1b" : "#fafafa" }}>
              <AnimatePresence mode="wait">
              <motion.div
                key={hoveredMethod}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                variants={cardContentVariants}
              >
              <motion.div variants={cardItemVariants} style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858", fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{content.title}</span>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2px 4px", borderRadius: 6, backgroundColor: isDark ? "#003b00" : "#caffca" }}>
                  <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "-0.48px", color: isDark ? "#7ef97e" : "#008000", fontFamily: "Geist, var(--font-geist-sans)" }}>{content.status}</span>
                </span>
              </motion.div>
              <motion.div variants={cardItemVariants} style={{ position: "absolute", top: 36, left: 8, width: 216, height: 116, borderRadius: 4, backgroundColor: isDark ? "#0f0f0f" : "#ffffff" }}>
                {content.jsonLabel && (
                  <span style={{ position: "absolute", top: 4, left: 193, fontSize: 10, fontWeight: 500, letterSpacing: "-0.4px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>json</span>
                )}
                {content.rows.length === 0 ? (
                  <>
                    <span style={{ position: "absolute", top: 49, left: 100, fontSize: 14, fontWeight: 500, letterSpacing: "-0.56px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>{"{"}</span>
                    <span style={{ position: "absolute", top: 49, left: 110, fontSize: 14, fontWeight: 500, letterSpacing: "-0.56px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>{"}"}</span>
                  </>
                ) : (
                  <>
                    <span style={{ position: "absolute", top: 4, left: 7, fontSize: 14, fontWeight: 500, letterSpacing: "-0.56px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>{"{"}</span>
                    <span style={{ position: "absolute", top: 94, left: 7, fontSize: 14, fontWeight: 500, letterSpacing: "-0.56px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>{"}"}</span>
                  </>
                )}
                {content.rows.map(([k, c, v, cm], i) => (
                  <div key={k} style={{ position: "absolute", top: 50 - ((content.rows.length - 1) * 20) / 2 + i * 20, left: 21, display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: keyColor, fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{k}</span>
                    <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{c}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: v.startsWith("\u201C") ? (isDark ? "#6bdc94" : "#1bc95a") : numColor, fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{v}</span>
                    <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{cm}</span>
                  </div>
                ))}
              </motion.div>
              </motion.div>
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
            <motion.div
              key={hoveredMethod}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              variants={cardContentVariants}
            >
            <motion.span variants={cardItemVariants} style={{ position: "absolute", top: 184, left: 223, fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: isDark ? "#f7f7f7" : "#242424", fontFamily: "Geist, var(--font-geist-sans)" }}>{content.label}</motion.span>
            <motion.span variants={cardItemVariants} style={{ position: "absolute", top: 204, left: 223, width: 227, fontSize: 12, fontWeight: 400, letterSpacing: "-0.48px", color: isDark ? "#adadad" : "#595959", fontFamily: "Geist, var(--font-geist-sans)" }}>{content.description}</motion.span>
            {content.description2 && (
              <motion.span variants={cardItemVariants} style={{ position: "absolute", top: 221, left: 223, width: 227, fontSize: 12, fontWeight: 400, letterSpacing: "-0.48px", color: isDark ? "#adadad" : "#595959", fontFamily: "Geist, var(--font-geist-sans)" }}>{content.description2}</motion.span>
            )}
            </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <input
        type="text"
        placeholder="Paste an API endpoint..."
        value={localUrl}
        onChange={(e) => { setLocalUrl(e.target.value); setUrl(e.target.value); }}
        className={`flex-1 bg-transparent text-sm tracking-[-0.04em] outline-none ${isDark ? "text-[#d1d1d1] placeholder:text-[#d1d1d1]" : "text-[#9e9e9e] placeholder:text-[#9e9e9e]"}`}
        style={{ fontFamily: "Geist, var(--font-geist-sans)" }}
      />

      <button
        onClick={() => onSend()}
        disabled={loading}
        className="flex items-center gap-1 px-2 py-1.5 text-xs text-white tracking-[-0.04em] transition-colors hover:bg-[#4a4aff] disabled:opacity-60"
        style={{ borderRadius: 6, backgroundColor: "#5b5bff" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3.333 8h9.334" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 3.333l4.667 4.667L8 12.667" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Send</span>
      </button>
    </div>
  );
}

function IconlyPlus({ size = 24, color = "#5B5BFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M15.8279 13.2847H12.9999V16.1087C12.9999 16.5227 12.6639 16.8587 12.2499 16.8587C11.8359 16.8587 11.4999 16.5227 11.4999 16.1087V13.2847H8.67194C8.25794 13.2847 7.92194 12.9487 7.92194 12.5347C7.92194 12.1207 8.25794 11.7847 8.67194 11.7847H11.4999V8.96067C11.4999 8.54667 11.8359 8.21067 12.2499 8.21067C12.6639 8.21067 12.9999 8.54667 12.9999 8.96067V11.7847H15.8279C16.2419 11.7847 16.5779 12.1207 16.5779 12.5347C16.5779 12.9487 16.2419 13.2847 15.8279 13.2847ZM12.2499 2.29767C4.69094 2.29767 2.01294 4.97567 2.01294 12.5347C2.01294 20.0937 4.69094 22.7717 12.2499 22.7717C19.8079 22.7717 22.4869 20.0937 22.4869 12.5347C22.4869 4.97567 19.8079 2.29767 12.2499 2.29767Z" fill={color} />
    </svg>
  );
}

function JsonView({ data, depth = 0 }: { data: any; depth?: number }) {
  const indent = depth * 16;
  if (data === null) return <span style={{ color: "#FE7C0B" }}>null</span>;
  if (typeof data === "boolean") return <span style={{ color: "#FE7C0B" }}>{String(data)}</span>;
  if (typeof data === "number") return <span style={{ color: "#FE7C0B" }}>{data}</span>;
  if (typeof data === "string") {
    return (
      <span>
        <span style={{ color: "#9e9e9e" }}>"</span>
        <span style={{ color: "#1BC95A" }}>{data}</span>
        <span style={{ color: "#9e9e9e" }}>"</span>
      </span>
    );
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return <span style={{ color: "#9e9e9e" }}>[]</span>;
    return (
      <>
        <span style={{ color: "#9e9e9e" }}>[</span>
        {data.map((item, i) => (
          <div key={i} style={{ paddingLeft: indent + 16 }}>
            <JsonView data={item} depth={depth + 1} />
            {i < data.length - 1 && <span style={{ color: "#9e9e9e" }}>,</span>}
          </div>
        ))}
        <div style={{ paddingLeft: indent }}>
          <span style={{ color: "#9e9e9e" }}>]</span>
        </div>
      </>
    );
  }
  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span style={{ color: "#9e9e9e" }}>{'{}'}</span>;
    return (
      <>
        <span style={{ color: "#9e9e9e" }}>{'{'}</span>
        {keys.map((key, i) => (
          <div key={key} style={{ paddingLeft: indent + 16 }}>
            <span style={{ color: "#9e9e9e" }}>"</span>
            <span style={{ color: "#0396DC" }}>{key}</span>
            <span style={{ color: "#9e9e9e" }}>"</span>
            <span style={{ color: "#9e9e9e" }}>: </span>
            <JsonView data={data[key]} depth={depth + 1} />
            {i < keys.length - 1 && <span style={{ color: "#9e9e9e" }}>,</span>}
          </div>
        ))}
        <div style={{ paddingLeft: indent }}>
          <span style={{ color: "#9e9e9e" }}>{'}'}</span>
        </div>
      </>
    );
  }
  return <span style={{ color: "#9e9e9e" }}>{String(data)}</span>;
}

function BodyViewer({ body, isDark }: { body: string; isDark: boolean }) {
  const [tab, setTab] = useState("pretty");
  let parsed: any = null;
  try { parsed = JSON.parse(body); } catch {}
  const isJson = parsed !== null && typeof parsed === "object";
  return (
    <div style={{ borderRadius: 8, border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#0f0f0f" : "#fcfcfc", width: "100%" }}>
      <div className="flex items-center" style={{ padding: "12px 12px 0" }}>
        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: isDark ? "#ffffff" : "#9e9e9e" }}>Body</span>
        <div className="flex items-center" style={{ borderRadius: 12, backgroundColor: isDark ? "#262626" : "#f2f2f2", padding: 4, gap: 8, marginLeft: "auto" }}>
          <div onClick={() => setTab("pretty")} style={{ borderRadius: 8, backgroundColor: tab === "pretty" ? (isDark ? "#1b1b1b" : "#fff") : "transparent", padding: "4px 6px", cursor: "pointer" }}>
            <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: tab === "pretty" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>Pretty</span>
          </div>
          <div onClick={() => setTab("raw")} style={{ borderRadius: 8, backgroundColor: tab === "raw" ? (isDark ? "#1b1b1b" : "#fff") : "transparent", padding: "4px 6px", cursor: "pointer" }}>
            <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: tab === "raw" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>Raw</span>
          </div>
        </div>
      </div>
      {tab === "pretty" && isJson ? (
<div className="hide-scrollbar" style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, maxHeight: 310, overflowY: "auto", overflowX: "hidden", wordBreak: "break-word", padding: "8px 12px 12px" }}>
          <JsonView data={parsed} />
        </div>
      ) : (
        <pre className="hide-scrollbar" style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: "#9e9e9e", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 310, overflowY: "auto", margin: 0, padding: "8px 12px 12px" }}>{body}</pre>
      )}
    </div>
  );
}


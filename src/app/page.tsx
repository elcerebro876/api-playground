"use client";
import { useState, useEffect, useCallback, useRef, Fragment, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence, animate, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import LoadingState from "@/components/LoadingState";
import { loadStoredData, saveStoredData, applyStreakOnLoad, type HistoryEntry } from "@/lib/storage";
const cardTextSpring = {  type: "spring" as const,  stiffness: 400,  damping: 25,  mass: 0.8,};
const cardContentVariants = {  hidden: {},  visible: {    transition: {      staggerChildren: 0.06,    },  },  exit: {    transition: {      staggerChildren: 0.05,      staggerDirection: -1,    },  },};
const cardItemVariants = {  hidden: { opacity: 0, y: 10 },  visible: {    opacity: 1,    y: 0,    transition: cardTextSpring,  },  exit: {    opacity: 0,    y: 10,    transition: cardTextSpring,  },};
const headersPanelTransition = {  duration: 0.25,  ease: "easeInOut" as const,};
const commonKeys = ["content-type", "date", "cache-control", "cf-cache-status", "etag"];
export default function Home() {  const [activeTheme, setActiveTheme] = useState("Light");
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headerKey, setHeaderKey] = useState("");
  const [headerBearer, setHeaderBearer] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [response, setResponse] = useState<{ status?: number;
 ok?: boolean;
 time?: number;
 headers?: Record<string, string>;
 body?: string;
 error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [apisTested, setApisTested] = useState(0);
  const [streak, setStreak] = useState(1);
  const responseKey = useRef(0);
  const [headersFilter, setHeadersFilter] = useState("common");
  const [activeHistoryIndex, setActiveHistoryIndex] = useState<number | null>(null);
  const [explorerHovered, setExplorerHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [is1440, setIs1440] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {    setMounted(true);    const mq = window.matchMedia("(max-width: 767px)");
    const check = () => setIsMobile(mq.matches);
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);
  useEffect(() => {    const mq = window.matchMedia("(max-width: 1024px)");
    const check = () => setIsCompact(mq.matches);
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);
  useEffect(() => {    const mq = window.matchMedia("(min-width: 1025px) and (max-width: 1440px)");
    const check = () => setIs1440(mq.matches);
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);
  useEffect(() => {    const data = loadStoredData();
    setHistory(data.history);
    setApisTested(data.apisTestedCount);
    const updated = applyStreakOnLoad(data);
    setStreak(updated.streak);
    saveStoredData(updated);
  }, []);
  const handleHistorySelect = (item: any, index: number) => {    setActiveHistoryIndex(index);
    setMethod(item.method);
    setUrl(item.url);
    if (item.responseBody) {      setResponse({ status: item.status, time: item.time, body: item.responseBody, headers: item.responseHeaders });
      setHeadersFilter("common");
    }  };
  const sendRequest = useCallback(async (opts?: { method?: string;
 url?: string;
 headers?: Record<string, string> }) => {    setLoading(true);
    setResponse(null);
    const m = opts?.method || method;
    const u = opts?.url || url;
    const h: Record<string, string> = {};
    if (opts?.headers) {      Object.assign(h, opts.headers);
    } else {      if (headerKey && headerValue) h[headerKey] = headerValue;
      if (headerBearer) h["Authorization"] = `Bearer ${headerBearer}`;
    }    try {      const res = await fetch("/api/proxy", {        method: "POST",        headers: { "Content-Type": "application/json" },        body: JSON.stringify({ method: m, url: u, headers: h, body: undefined }),      });
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
    } catch {      responseKey.current += 1;
      setResponse({ error: "Network error" });
      setHeadersFilter("common");
      const entry = { method: m, url: u, status: null, time: null, timestamp: Date.now(), headers: h };
      const nextHistory = [entry, ...history];
      setHistory(nextHistory);
      saveStoredData({ history: nextHistory, apisTestedCount: apisTested, streak, lastVisitDate: new Date().toDateString() });
      setActiveHistoryIndex(0);
      setLoading(false);
    }}, [method, url, headerKey, headerBearer, headerValue, history, apisTested, streak]);
  const lowestLatency = useMemo(() => {    const times = history.map((item) => item.time).filter((t): t is number => typeof t === "number" && t > 0);
    return times.length ? Math.min(...times) : null;
  }, [history]);
  if (!mounted) {    return <div style={{ minHeight: "100vh", backgroundColor: activeTheme === "dark" ? "#0f0f0f" : "#fafafa" }} />;  }    if (isMobile) {    return (      <MobilePrimary activeTheme={activeTheme} onThemeChange={setActiveTheme} apisTested={apisTested} streak={streak} lowestLatency={lowestLatency} method={method}        setMethod={setMethod}        url={url}        setUrl={setUrl}        headerKey={headerKey}        setHeaderKey={setHeaderKey}        headerBearer={headerBearer}        setHeaderBearer={setHeaderBearer}        headerValue={headerValue}        setHeaderValue={setHeaderValue}        response={response}        loading={loading}        onSend={(opts) => sendRequest(opts)}        onClearResponse={() => { setLoading(false); setResponse(null); setActiveHistoryIndex(null); setUrl(""); setMethod("GET"); setHeaderKey(""); setHeaderBearer(""); setHeaderValue(""); }}        history={history}        activeHistoryIndex={activeHistoryIndex}                onHistorySelect={handleHistorySelect}
        headersFilter={headersFilter}
        setHeadersFilter={setHeadersFilter}
      />    );
  }  return (    <div className={`relative h-screen overflow-hidden font-sans ${activeTheme === "Dark" ? "bg-[#111111]" : "bg-white"}`} style={{ minWidth: 900 }}>      <div className="absolute" style={{ left: 12, top: 12 }}>        <span          className={`text-sm font-medium tracking-[-0.07em] ${activeTheme === "Dark" ? "text-white" : "text-[#222222]"}`}          style={{ fontFamily: "Geist, var(--font-geist-sans)", fontWeight: 500 }}        >          Playground        </span>      </div>      <div        className="absolute overflow-hidden"        style={{          top: 42,          right: 32,          bottom: 32,          left: 48,          backgroundColor: activeTheme === "Dark" ? "#161616" : "#FAFAFAFA",          border: activeTheme === "Dark" ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2",          borderRadius: 16,        }}      >        <div className="flex h-full">          <motion.div            initial={{ opacity: 0, y: 12 }}            animate={{ opacity: 1, y: 0 }}            transition={{ duration: 0.4, ease: "easeOut" }}          >            <Sidebar activeTheme={activeTheme} onThemeChange={setActiveTheme} history={history} activeHistoryIndex={activeHistoryIndex} onSelect={handleHistorySelect} onRetry={(item) => sendRequest({ method: item.method, url: item.url, headers: item.headers })} compact={isCompact} />          </motion.div>          {!isCompact && (
          <div className="flex flex-col py-4">
            <div className={`w-px flex-1 ${activeTheme === "Dark" ? "bg-[#2d2d2d]" : "bg-[#ededed]"}`} />
          </div>
        )}          <motion.div            className="flex min-w-0 flex-1 flex-col"            initial={{ opacity: 0, y: 12 }}            animate={{ opacity: 1, y: 0 }}            transition={{ duration: 0.4, ease: "easeOut" }}          >            <MainContent activeTheme={activeTheme} method={method} setMethod={setMethod} url={url} setUrl={setUrl} headerKey={headerKey} setHeaderKey={setHeaderKey} headerBearer={headerBearer} setHeaderBearer={setHeaderBearer} headerValue={headerValue} setHeaderValue={setHeaderValue} response={response} loading={loading} onSend={(opts) => sendRequest(opts)} responseKey={responseKey.current} headersFilter={headersFilter} setHeadersFilter={setHeadersFilter} history={history} activeHistoryIndex={activeHistoryIndex} onHistorySelect={handleHistorySelect} compact={isCompact} w1440={is1440} />          </motion.div>        </div>      </div>      <div className="absolute" style={{ left: 12, top: 54, cursor: "pointer" }} onClick={() => { setResponse(null);
 setActiveHistoryIndex(null);
 setUrl("");
 setMethod("GET");
 setHeaderKey("");
 setHeaderBearer("");
 setHeaderValue("");
 setHeadersFilter("common");
 }}>        <IconlyPlus />      </div>      <AnimatePresence>        {explorerHovered && (          <motion.div            key="glass"            className="absolute inset-0"            style={{              zIndex: 5,              pointerEvents: "none",              backdropFilter: "blur(36.75px)",              WebkitBackdropFilter: "blur(36.75px)",              background:                activeTheme === "Dark"                  ? "linear-gradient(-23.5deg, rgba(36, 36, 36, 0.47), rgba(129, 129, 129, 0))"                  : "linear-gradient(-23.5deg, rgba(180, 180, 180, 0.47), rgba(230, 230, 230, 0))",              opacity: 0.75,            }}            initial={{ opacity: 0 }}            animate={{ opacity: 0.75 }}            exit={{ opacity: 0 }}            transition={{ duration: 0.18, ease: "easeOut" }}          />        )}      </AnimatePresence>      <div        className="absolute"        style={{ left: 12, bottom: 48, zIndex: 10 }}        onMouseEnter={() => setExplorerHovered(true)}        onMouseLeave={() => setExplorerHovered(false)}      >        <div className="overflow-hidden" style={{ width: 24, height: 24, borderRadius: 8 }}>          <img            src="/Explorer%20image.jpg"            alt=""            style={{ width: "100%", height: "100%", objectFit: "cover" }}            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}          />        </div>        <AnimatePresence>          {explorerHovered && <ExplorerCard key="card" activeTheme={activeTheme} apisTested={apisTested} streak={streak} lowestLatency={lowestLatency} />}        </AnimatePresence>      </div>    </div>  );
}function MobilePrimary({  activeTheme,  onThemeChange,  apisTested,  streak,  lowestLatency,  method,  setMethod,  url,  setUrl,  headerKey,  setHeaderKey,  headerBearer,  setHeaderBearer,  headerValue,  setHeaderValue,  response,  loading,  onSend,  onClearResponse,  history,  activeHistoryIndex,  onHistorySelect,  headersFilter,  setHeadersFilter,}: {  activeTheme: string;
  onThemeChange: (t: string) => void;
  apisTested: number;
  streak: number;
  lowestLatency: number | null;
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
  response: { status?: number;
 ok?: boolean;
 time?: number;
 headers?: Record<string, string>;
 body?: string;
 error?: string } | null;
  loading: boolean;
  onSend: (opts?: { method?: string;
 url?: string;
 headers?: Record<string, string> }) => void;
  onClearResponse: () => void;
  history: any[];
  activeHistoryIndex: number | null;
  onHistorySelect: (item: any, index: number) => void;
  headersFilter: string;
  setHeadersFilter: (v: string) => void;
}) {  const isDark = activeTheme === "Dark";
  const [showDropdown, setShowDropdown] = useState(false);
  const [resultDropdown, setResultDropdown] = useState(false);
  const sheetProgress = useMotionValue(0);
  const wrapClip = useTransform(sheetProgress, (p) => `inset(${p * 50}% 0% ${p * 50}% 0%)`);
  const sheetOpacity = useTransform(sheetProgress, (p) => 1 - p);
  useEffect(() => {
    if (loading || response) sheetProgress.set(0);
  }, [loading, response]);
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [cleanSheetDismissed, setCleanSheetDismissed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("cleanSheetDismissed") === "1");
  const [showHistory, setShowHistory] = useState(false);
  const [showHeadersTip, setShowHeadersTip] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [navExplorer, setNavExplorer] = useState(false);
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const [localUrl, setLocalUrl] = useState(url);
  useEffect(() => {    setLocalUrl(url);
  }, [url]);
  const contentWidth = "min(343px, calc(100vw - 32px))";
  return (    <div className="relative flex flex-col overflow-hidden" style={{ height: "100dvh", backgroundColor: isDark ? "#1b1b1b" : "#f5f5f5", fontFamily: "Geist, var(--font-geist-sans)" }}>            <div style={{ position: "absolute", left: 16, top: 40, display: "flex", flexDirection: "column", gap: 8, zIndex: 10, cursor: "pointer" }} onClick={() => setShowNav(true)}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 24, height: 1, backgroundColor: isDark ? "#ffffff" : "#595959" }} />
))}
        </div>
      <AnimatePresence>
        {showNav && (
          <motion.div
            key="nav-glass"
            className="fixed inset-0"
            style={{
              zIndex: 50,
              backdropFilter: "blur(36.75px)",
              WebkitBackdropFilter: "blur(36.75px)",
              background: isDark
                ? "linear-gradient(-23.5deg, rgba(36, 36, 36, 0.47), rgba(129, 129, 129, 0))"
                : "linear-gradient(-23.5deg, rgba(180, 180, 180, 0.47), rgba(230, 230, 230, 0))",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={() => { setShowNav(false); setNavExplorer(false); }}
          />
        )}
        {showNav && (
          <motion.div
            key="nav-panel"
            className="fixed"
            style={{ left: 0, top: 0, bottom: 0, width: 331, zIndex: 60, backgroundColor: isDark ? "#111111" : "#ffffff" }}
            initial={{ x: -331 }}
            animate={{ x: 0 }}
            exit={{ x: -331, transition: { type: "tween", duration: 0.22, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div
              style={{
                position: "absolute",
                left: 56,
                top: 29,
                bottom: 0,
                width: 275,
                backgroundColor: isDark ? "#161616" : "#fafafa",
                borderTopLeftRadius: 12,
                borderBottomLeftRadius: 12,
                border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2",
                borderRight: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: 16,
                  fontFamily: "Geist, var(--font-geist-sans)",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.7px",
                  color: isDark ? "#f7f7f7" : "#585858",
                }}
              >
                Explorer Log
              </span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ position: "absolute", left: 241, top: 16, cursor: "pointer" }} onClick={() => { setShowNav(false); setNavExplorer(false); }}>
                <circle cx="9" cy="9" r="7.5" stroke="#9e9e9e" strokeWidth="1.4" />
                <path d="M6 6l6 6M12 6l-6 6" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
                {history.length === 0 ? (
                  <div className="flex flex-col items-center" style={{ position: "absolute", left: 63.5, top: 346.5, gap: 12 }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                      <svg x={11.099} y={19.12} width={9.698} height={4.268} viewBox="0 0 37.580101013183594 16.539901733398438" preserveAspectRatio="none">
                        <path d="M36.760002 0.40990448C37.090004 0.33990449 37.370102 0.20999999 37.580101 0L36.760002 0.40990448ZM0 16.539902C0.23999999 16.469902 0.4599002 16.359901 0.63990021 16.219902L0 16.539902Z" fill="#5b5bff" fillRule="nonzero" />
                      </svg>
                      <svg x={16.361} y={18.555} width={4.436} height={1} viewBox="0 0 17.190200805664062 2.5999984741210938" preserveAspectRatio="none">
                        <path d="M0 0.38999939L0.7901001 0M16.370201 2.5999985C16.700201 2.5299985 16.980202 2.400094 17.190201 2.190094L16.370201 2.5999985Z" fill="#5b5bff" fillRule="nonzero" />
                      </svg>
                      <svg x={13.308} y={19.158} width={9.546} height={12.303} viewBox="0 0 36.98989486694336 47.674537628889084" preserveAspectRatio="none">
                        <path d="M36.9799 34.123787C36.909901 28.373787 35.0998 22.453688 31.5798 16.373688C28.3298 10.773687 24.479998 6.503788 20.009998 3.5537882C19.509998 3.2237883 18.999899 2.9137857 18.489899 2.6137857C16.399899 1.4037857 14.4398 0.62368375 12.5998 0.24368376C10.2998 -0.21631625 8.1997967 -0.026215255 6.2997971 0.82378477L5.4098969 1.2636881C5.3498969 1.2936881 5.2899003 1.3336887 5.2299004 1.3736887C1.9599004 3.3236887 0.22000046 6.9037838 0.020000458 12.103784C0.010000458 12.443784 0 12.793688 0 13.153687C0 19.033688 1.799897 25.073685 5.4098969 31.293785C9.0098972 37.523785 13.369899 42.10379 18.489899 45.063789C23.609898 48.01379 27.969799 48.463787 31.5798 46.413788C35.179798 44.353786 36.989895 40.383785 36.989895 34.513786C36.989895 34.383785 36.989895 34.253788 36.989895 34.123787L36.9799 34.123787ZM25.889896 36.603783C25.519896 36.813782 25.0898 36.773788 24.5998 36.483788C24.0998 36.203789 23.669798 35.743782 23.299797 35.103783L17.75 25.533684C17.379999 24.893684 17.099899 24.253687 16.919899 23.623688C16.729898 22.983688 16.6399 22.383789 16.6399 21.813789L16.6399 12.153687C16.6399 11.593687 16.829897 11.203684 17.199898 10.993684C17.569899 10.783684 17.999899 10.813784 18.489899 11.103784C18.979898 11.383783 19.419798 11.853788 19.789799 12.483788C20.1598 13.123789 20.339798 13.723687 20.339798 14.293687L20.339798 24.053787L25.889896 33.623787C26.259897 34.263786 26.439899 34.863785 26.439899 35.433784C26.439899 36.003784 26.259897 36.383781 25.889896 36.603783Z" fill="#5b5bff" fillRule="nonzero" />
                      </svg>
                      <svg x={17.602} y={21.96} width={2.529} height={6.678} viewBox="0 0 9.800003051757812 25.878543868660927" preserveAspectRatio="none">
                        <path d="M9.8000031 24.576244C9.8000031 25.146244 9.6199999 25.526243 9.25 25.746243C8.8800001 25.956242 8.4498997 25.916248 7.9598999 25.626247C7.4598999 25.346247 7.0299006 24.886242 6.6599007 24.246243L1.1100998 14.676144C0.74009979 14.036143 0.45999879 13.396148 0.27999878 12.766148C0.089998782 12.126147 0 11.526249 0 10.956249L0 1.2961462C0 0.73614615 0.19000137 0.34614241 0.56000137 0.13614243C0.93000138 -0.073857561 1.3601015 -0.043757766 1.8501015 0.24624223C2.3401015 0.52624226 2.7798986 0.99624717 3.1498985 1.6262472C3.5198984 2.2662473 3.6999016 2.8661456 3.6999016 3.4361455L3.6999016 13.196148L9.25 22.766247C9.6199999 23.406246 9.8000031 24.006245 9.8000031 24.576244Z" fill="#5b5bff" fillRule="nonzero" />
                      </svg>
                      <svg x={14.936} y={17.615} width={13.081} height={13.52} viewBox="0 0 50.69020080566406 52.390098571777344" preserveAspectRatio="none">
                        <path d="M50.680199 30.489998C50.680199 36.3601 48.870003 40.330097 45.270004 42.390099L44.380104 42.830093L25.270004 52.390099C28.870005 50.330097 30.680199 46.360096 30.680199 40.490097C30.680199 40.360096 30.680199 40.230099 30.680199 40.100098C30.610199 34.350098 28.799999 28.429998 25.279999 22.349998C22.029999 16.749998 18.180201 12.479999 13.710201 9.5299988C13.210201 9.1999989 12.700201 8.8900957 12.190201 8.5900955C10.100201 7.3800955 8.1401024 6.5999937 6.3001022 6.2199936C4.000102 5.7599936 1.9 5.9499955 0 6.7999954L5.5300026 4.0299988L6.3201027 3.6399994L12.740002 0.43000031C13.490002 0.88000029 14.250002 1.3699939 14.990002 1.8999939C15.220001 2.049994 15.440202 2.209995 15.660202 2.3699951C16.800201 3.199995 17.890202 4.0999975 18.940201 5.0599976C19.9902 6.0199976 20.9802 6.4099979 21.9002 6.2399979C22.2302 6.1699977 22.510201 6.0400934 22.7202 5.8300934L22.75 5.8099976L34.390099 0C38.570099 2.9200001 42.199997 7.0399985 45.279999 12.349998C48.879997 18.569998 50.690201 24.619999 50.690201 30.489998L50.680199 30.489998Z" fill="#5b5bff" fillRule="nonzero" />
                      </svg>
                      <svg x={6.096} y={6.517} width={12.516} height={9} viewBox="0 0 48.500755310058594 34.87453073263168" preserveAspectRatio="none">
                        <path d="M48.476414 31.046249C48.456413 31.256248 48.426311 31.456249 48.376312 31.65625C48.136311 32.67625 47.576416 33.22625 46.716415 33.286251L45.286213 33.40625L27.946417 34.86615C27.386417 34.896149 26.796415 34.846249 26.186415 34.706249C25.566414 34.556248 24.916214 34.286251 24.246214 33.896252C23.566214 33.506252 22.916218 33.026249 22.296217 32.456249C21.686216 31.89625 21.096214 31.266249 20.546215 30.596249L10.976415 18.716251L1.8663152 7.3962517C0.99631524 6.3262515 0.42631498 5.1362495 0.14631498 3.8062496C-0.12368503 2.4762497 -0.023584962 1.4661493 0.47641504 0.75614935C0.96641505 0.046149373 1.7064152 -0.16384983 2.6964152 0.12615016C3.6764152 0.41615015 4.6064148 1.0862499 5.4664149 2.15625L10.946414 8.9362488L24.246214 25.40625L43.016212 23.83625C43.876213 23.766251 44.806213 24.156149 45.786213 25.006149C46.776215 25.86615 47.516212 26.92625 48.006214 28.196251C48.406216 29.226252 48.566414 30.176249 48.476414 31.046249Z" fill="#5b5bff" fillRule="nonzero" />
                      </svg>
                      <svg x={11.264} y={16.701} width={5.505} height={6.605} viewBox="0 0 21.330101013183594 25.593135833740234" preserveAspectRatio="none">
                        <path d="M21.330101 1.2431371C20.870102 3.0231371 20.6101 4.9931374 20.5401 7.1731377L19.75 7.5731392L14.220001 10.343136L13.330101 10.783039C13.270101 10.813039 13.2102 10.85304 13.1502 10.89304C9.8801994 12.84304 8.1402006 16.423134 7.9402008 21.623135L0 25.593136C0.66000003 25.063135 0.90020102 24.04314 0.70020103 22.54314C0.58020103 21.913141 0.52010155 21.253134 0.52010155 20.583134L0.52010155 18.403034C0.52010155 11.053034 2.5401015 5.8430367 6.6001015 2.7730367C7.0701013 2.4030366 7.5701017 2.0730367 8.1001015 1.7730367C11.920101 -0.39696336 16.330101 -0.57686293 21.330101 1.2431371Z" fill="#5b5bff" fillRule="nonzero" />
                      </svg>
                      <svg x={4.343} y={0.55} width={21.763} height={18.565} viewBox="0 0 84.32987976074219 71.94001770019531" preserveAspectRatio="none">
                        <path d="M84.32988 45.760021L84.32988 60.200123C84.32988 61.470123 83.86998 62.190022 82.93998 62.370022L75.429985 66.13002L63.789776 71.940018C64.149773 71.570015 64.32988 70.99012 64.32988 70.200119L64.32988 55.760021C64.32988 54.780022 64.199974 53.770023 63.939976 52.750023C63.789974 52.160023 63.599884 51.56012 63.359882 50.960121C62.869881 49.720119 62.239979 48.54002 61.45998 47.420021C61.199982 47.04002 60.91988 46.670021 60.629879 46.31002L54.129879 38.27002L34.739979 14.27002C34.179977 13.59002 33.589981 12.97002 32.97998 12.41002C32.359982 11.84002 31.70978 11.360121 31.03978 10.97012C30.359779 10.570121 29.729877 10.32002 29.139877 10.19002C28.549877 10.060019 27.949879 10.00002 27.339878 10.00002L17.739979 10.79002L1.43995 12.13002C1.04995 12.16002 0.68987 12.24002 0.35986996 12.37002L0.32983971 12.37002C0.21983971 12.42002 0.11 12.470019 0 12.53002L19.769981 2.6500301C20.249981 2.3600302 20.80998 2.1800101 21.43998 2.1300101L47.339878 0C47.949879 0 48.549877 0.060070157 49.139877 0.19007015C49.729877 0.32007015 50.359779 0.57010019 51.03978 0.97010016C51.709778 1.3601002 52.359982 1.84004 52.97998 2.4100399C53.589981 2.9700398 54.179977 3.5900199 54.739979 4.27002L80.629883 36.31002C81.799881 37.760021 82.709885 39.31012 83.359886 40.960121C84.009888 42.610123 84.32988 44.210022 84.32988 45.760021Z" fill="#5b5bff" fillRule="nonzero" />
                      </svg>
                    </svg>
                    <div className="flex flex-col items-center" style={{ gap: 8 }}>
                      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isDark ? "#f7f7f7" : "#696969" }}>No requests yet</span>
                      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#adadad" : "#939393" }}>Your log fills in as you explore</span>
                    </div>
                  </div>
                ) : (
                  <div className="hide-scrollbar" style={{ position: "absolute", left: 12, top: 110, right: 12, bottom: 80, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                    {history.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center"
                      style={{
                        gap: 6,
                        borderRadius: 6,
                        padding: "10px 12px",
                        cursor: "pointer",
                        backgroundColor: isDark ? (i === activeHistoryIndex ? "#1f1f1f" : "transparent") : (i === activeHistoryIndex ? "#ffffff" : "transparent"),
                      }}
                      onClick={() => {
                        onHistorySelect(item, i);
                        setShowNav(false);
                        setNavExplorer(false);
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: methodDots[item.method] ?? "#008000", flexShrink: 0 }} />
                      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#f7f7f7" : "#636363", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.url}</span>
                    </div>
                    ))}
                  </div>
                )}
<div style={{ position: "absolute", left: 16, bottom: "calc(24px + env(safe-area-inset-bottom))" }}>
                <ThemeToggle activeTheme={activeTheme} onThemeChange={onThemeChange} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 16, top: 45, cursor: "pointer" }} onClick={() => { setShowNav(false); setNavExplorer(false); onClearResponse(); }}>
              <svg width="24" height="25" viewBox="0 0 24 25" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                <svg x={2.013} y={2.798} width={20.474} height={20.474} viewBox="0 0 20.473960876464844 20.474029541015625" preserveAspectRatio="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M13.81496 10.98703L10.986959 10.98703L10.986959 13.811029C10.986959 14.225029 10.650959 14.561029 10.236959 14.561029C9.8229599 14.561029 9.4869595 14.225029 9.4869595 13.811029L9.4869595 10.98703L6.6589999 10.98703C6.2449999 10.98703 5.9089999 10.65103 5.9089999 10.23703C5.9089999 9.8230305 6.2449999 9.48703 6.6589999 9.48703L9.4869595 9.48703L9.4869595 6.6630006C9.4869595 6.2490005 9.8229599 5.9130006 10.236959 5.9130006C10.650959 5.9130006 10.986959 6.2490005 10.986959 6.6630006L10.986959 9.48703L13.81496 9.48703C14.22896 9.48703 14.56496 9.8230305 14.56496 10.23703C14.56496 10.65103 14.22896 10.98703 13.81496 10.98703ZM10.236959 0C2.6779995 0 0 2.678 0 10.23703C0 17.79603 2.6779995 20.47403 10.236959 20.47403C17.79496 20.47403 20.473961 17.79603 20.473961 10.23703C20.473961 2.678 17.79496 0 10.236959 0Z" fill="#5b5bff" />
                </svg>
              </svg>
            </div>
                        {navExplorer && (
              <motion.div
                key="nav-explorer-glass"
                className="absolute inset-0"
                style={{
                  zIndex: 5,
                  backdropFilter: "blur(36.75px)",
                  WebkitBackdropFilter: "blur(36.75px)",
                  background: isDark
                    ? "linear-gradient(-23.5deg, rgba(36, 36, 36, 0.47), rgba(129, 129, 129, 0))"
                    : "linear-gradient(-23.5deg, rgba(180, 180, 180, 0.47), rgba(230, 230, 230, 0))",
                  opacity: 0.75,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={() => setNavExplorer(false)}
              />
            )}
            <div style={{ position: "absolute", left: 16, bottom: "calc(24px + env(safe-area-inset-bottom))", zIndex: 10, cursor: "pointer" }} onClick={() => setNavExplorer((v) => !v)}>
              <div className="overflow-hidden" style={{ width: 24, height: 24, borderRadius: 8 }}>
                <img src="/Explorer%20image.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
              </div>
              <AnimatePresence>
                {navExplorer && <ExplorerCard key="card" activeTheme={activeTheme} apisTested={apisTested} streak={streak} lowestLatency={lowestLatency} />}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>      <AnimatePresence initial={false}>
        {loading || response ? (
          <motion.div key="result" className="flex flex-col" style={{ width: "100%", padding: "80px 16px calc(18px + env(safe-area-inset-bottom))", minHeight: 0, position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} initial={{ opacity: 0, scale: 0.92, y: 28 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
            <motion.div style={{ opacity: sheetOpacity, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <motion.div style={{ clipPath: wrapClip, position: "relative", width: "100%", flex: 1, minHeight: 0, maxHeight: 636, borderRadius: 16, backgroundColor: isDark ? "#161616" : "#fcfcfc" }}>
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 150 }}
              dragElastic={0.35}
              dragMomentum={false}
              dragSnapToOrigin
              onDrag={(e, info) => sheetProgress.set(Math.min(0.8, Math.max(0, info.offset.y / 150)))}
              onDragEnd={(e, info) => {
                if (info.offset.y > 80 || info.velocity.y > 500) {
                  animate(sheetProgress, 0.8, { duration: 0.3, ease: "easeIn" });
                  setTimeout(onClearResponse, 300);
                } else {
                  animate(sheetProgress, 0, { type: "spring", stiffness: 300, damping: 30 });
                }
              }}
              style={{ position: "absolute", left: 16, right: 16, top: 0, height: 36, zIndex: 25, cursor: "grab", display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 4 }}
            >
              <div style={{ width: 47, height: 4, borderRadius: 4, backgroundColor: isDark ? "#7a7a7a" : "#5a5a5a" }} />
            </motion.div>
              <MobileResultSection activeTheme={activeTheme} method={method} url={url} response={loading ? null : response} headersFilter={headersFilter} setHeadersFilter={setHeadersFilter} />
            </motion.div>
            <div style={{ marginTop: 24, flexShrink: 0, height: 52, boxSizing: "border-box", borderRadius: 12, border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#161616" : "#ffffff", display: "flex", alignItems: "center", padding: "0 12px", overflow: "hidden" }}>
              <div className="relative">
                <button onClick={() => setResultDropdown((v) => !v)} className="flex items-center" style={{ gap: 4, borderRadius: 8, border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#171717" : "#fcfcfc", padding: "6px 8px", cursor: "pointer" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: methodDots[method] ?? "#008000", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "-0.48px", color: isDark ? "#ffffff" : "#5a5a5a", fontFamily: "Geist, var(--font-geist-sans)" }}>{method}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l6 6 6-6" stroke="#5a5a5a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <AnimatePresence>
                  {resultDropdown && (
                    <motion.div
                      key="result-method-dropdown"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
                      style={{ position: "absolute", left: 0, bottom: "calc(100% + 6px)", zIndex: 30, width: 140, borderRadius: 8, backgroundColor: isDark ? "#0f0f0f" : "#ffffff", border: isDark ? "0.8px solid #312f2f" : "none", boxShadow: isDark ? "0 12px 14px rgba(61, 61, 61, 0.30)" : "0 12px 14px rgba(219, 219, 219, 0.30)", padding: 4, overflow: "hidden" }}
                    >
                      {methods.map((m) => (
                        <button
                          key={m}
                          onClick={() => { setMethod(m); setResultDropdown(false); }}
                          className="flex items-center"
                          style={{ width: "100%", gap: 6, padding: "6px 8px", borderRadius: 6, backgroundColor: m === method ? (isDark ? "#1f1f1f" : "#f7f7f7") : "transparent", cursor: "pointer" }}
                        >
                          <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: methodDots[m] ?? "#008000" }} />
                          <span style={{ fontSize: 12, color: isDark ? "#d1d1d1" : "#5a5a5a", fontFamily: "Geist, var(--font-geist-sans)" }}>{m}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <input
                type="text"
                placeholder="Paste an endpoint..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="placeholder:text-[#9e9e9e]"
                style={{ flex: 1, minWidth: 0, background: "transparent", outline: "none", border: "none", fontSize: 14, letterSpacing: "-0.56px", color: isDark ? "#d1d1d1" : "#5a5a5a", fontFamily: "Geist, var(--font-geist-sans)", marginLeft: 13, marginRight: 12 }}
              />
              <button onClick={() => onSend()} disabled={loading} style={{ display: "flex", alignItems: "center", borderRadius: 6, backgroundColor: "#5b5bff", padding: "6px 8px", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3.333 8h9.334" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 3.333l4.667 4.667L8 12.667" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </motion.div>
          </motion.div>
        ) : (
          <motion.div key="explorer" className="flex flex-col justify-center" style={{ width: "100%", padding: "0 16px", minHeight: 0, position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            <motion.div initial="hidden" animate="visible" variants={cardContentVariants} className="flex flex-col" style={{ width: "100%", gap: 16 }}>          <motion.div variants={cardItemVariants} style={{ borderRadius: 16, backgroundColor: isDark ? "#161616" : "#fcfcfc", padding: 20 }}>            <h1 style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-1px", textAlign: "center", color: isDark ? "#ffffff" : "#222222" }}>Welcome, Explorer</h1>            <div className="flex items-center" style={{ marginTop: 20, gap: 8, borderRadius: 12, border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#212121" : "#ffffff", padding: 10 }}>              <div className="relative">                <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center" style={{ gap: 4, borderRadius: 8, border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#171717" : "#fcfcfc", padding: "6px 8px" }}>                  <span className="flex items-center" style={{ gap: 4 }}>                    <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: methodDots[method] ?? "#008000" }} />                    <span style={{ fontSize: 12, color: isDark ? "#ffffff" : "#5a5a5a" }}>{method}</span>                  </span>                  <motion.svg width="17" height="16" viewBox="0 0 17 16" fill="none" animate={{ rotate: showDropdown ? 180 : 0 }} transition={cardTextSpring} style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}>                    <path d="M4 6l6 6 6-6" stroke="#5a5a5a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                  </motion.svg>                </button>                <AnimatePresence>                {showDropdown && (                  <motion.div                    key="method-dropdown"                    style={{ position: "absolute", left: 0, top: "calc(100% + 6px)", zIndex: 20, width: 140, borderRadius: 8, backgroundColor: isDark ? "#0f0f0f" : "#ffffff", border: isDark ? "0.8px solid #312f2f" : "none", boxShadow: isDark ? "0 12px 14px rgba(61, 61, 61, 0.30)" : "0 12px 14px rgba(219, 219, 219, 0.30)", padding: 4, overflow: "hidden" }}                    initial={{ opacity: 0, y: -8 }}                    animate={{ opacity: 1, y: 0 }}                    exit={{ opacity: 0, y: -8 }}                    transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}                  >                    {methods.map((m) => (                      <button                        key={m}                        onClick={() => {                          setMethod(m);
                          setShowDropdown(false);
                        }}                        className="flex items-center"                        style={{ width: "100%", gap: 6, padding: "6px 8px", borderRadius: 6, backgroundColor: m === method ? (isDark ? "#1f1f1f" : "#f7f7f7") : "transparent" }}                      >                        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: methodDots[m] ?? "#008000" }} />                        <span style={{ fontSize: 12, color: isDark ? "#d1d1d1" : "#5a5a5a" }}>{m}</span>                      </button>                    ))}                  </motion.div>              )}            </AnimatePresence>              </div>              <input                type="text"                placeholder="Paste an API endpoint..."                value={localUrl}                onChange={(e) => {                  setLocalUrl(e.target.value);
                  setUrl(e.target.value);
                }}                style={{ flex: 1, minWidth: 0, background: "transparent", outline: "none", border: "none", fontSize: 12, letterSpacing: "-0.48px", color: "#9e9e9e" }}              />              <button onClick={() => onSend()} disabled={loading} style={{ display: "flex", alignItems: "center", borderRadius: 6, backgroundColor: "#5b5bff", padding: "6px 8px", opacity: loading ? 0.6 : 1 }}>                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">                  <path d="M3.333 8h9.334" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                  <path d="M8 3.333l4.667 4.667-4.667 4.667" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                </svg>              </button>            </div>            {!headerExpanded && (<div className="flex items-center" style={{ marginTop: 16, gap: 16, cursor: "pointer", justifyContent: "center" }} onClick={() => { setHeaderExpanded(true); if (!cleanSheetDismissed) setShowCheatSheet(true); }}>              <div className="flex items-center" style={{ gap: 4 }}>                <svg width="16" height="16" viewBox="0 0 25 25" fill="none">                  <path fillRule="evenodd" clipRule="evenodd" d="M12.0369 8.71262C12.4511 8.71262 12.7869 9.0484 12.7869 9.46262V16.611C12.7869 17.0253 12.4511 17.361 12.0369 17.361C11.6227 17.361 11.2869 17.0253 11.2869 16.611V9.46262C11.2869 9.0484 11.6227 8.71262 12.0369 8.71262Z" fill="#5B5BFF" />                  <path fillRule="evenodd" clipRule="evenodd" d="M7.70886 13.0368C7.70886 12.6226 8.04465 12.2868 8.45886 12.2868H15.6147C16.0289 12.2868 16.3647 12.6226 16.3647 13.0368C16.3647 13.451 16.0289 13.7868 15.6147 13.7868H8.45886C8.04465 13.7868 7.70886 13.451 7.70886 13.0368Z" fill="#5B5BFF" />                  <path fillRule="evenodd" clipRule="evenodd" d="M4.96051 5.96045C3.66147 7.25949 3.05005 9.42738 3.05005 13.0368C3.05005 16.6463 3.66147 18.8142 4.96051 20.1132C6.25956 21.4123 8.42744 22.0237 12.0369 22.0237C15.6463 22.0237 17.8142 21.4123 19.1133 20.1132C20.4123 18.8142 21.0237 16.6463 21.0237 13.0368C21.0237 9.42738 20.4123 7.25949 19.1133 5.96045C17.8142 4.6614 15.6463 4.04999 12.0369 4.04999C8.42744 4.04999 6.25956 4.6614 4.96051 5.96045ZM3.89985 4.89979C5.6437 3.15594 8.34424 2.54999 12.0369 2.54999C15.7295 2.54999 18.4301 3.15594 20.1739 4.89979C21.9178 6.64364 22.5237 9.34418 22.5237 13.0368C22.5237 16.7295 21.9178 19.43 20.1739 21.1739C18.4301 22.9177 15.7295 23.5237 12.0369 23.5237C8.34424 23.5237 5.6437 22.9177 3.89985 21.1739C2.156 19.43 1.55005 16.7295 1.55005 13.0368C1.55005 9.34418 2.156 6.64364 3.89985 4.89979Z" fill="#5B5BFF" />                </svg>                <span style={{ fontSize: 14, letterSpacing: "-0.56px", color: "#5b5bff" }}>Header</span>              </div>              <span style={{ fontSize: 14, letterSpacing: "-0.56px", color: "#9e9e9e" }}>Optional</span>            </div>            )}            <div style={{ position: "relative" }}>            <AnimatePresence>              {headerExpanded && (                <motion.div                  key="mobile-headers-panel"                  style={{ marginTop: 16, overflow: "hidden" }}                  initial={{ height: 0, opacity: 0 }}                  animate={{ height: "auto", opacity: 1 }}                  exit={{ height: 0, opacity: 0 }}                  transition={headersPanelTransition}                >                  <div style={{ alignSelf: "center", width: `calc(${contentWidth} - 32px)`, borderRadius: 8, backgroundColor: isDark ? "#0f0f0f" : "#fcfcfc", border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2", padding: 12 }}>                    <div className="flex items-center" style={{ gap: 8 }}>                      <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: isDark ? "#f7f7f7" : "#585858" }}>Headers</span>                      <div style={{ position: "relative", display: "inline-flex" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ cursor: "pointer" }} onClick={() => setShowHeadersTip((v) => !v)}>
                          <circle cx="8" cy="8" r="6.667" stroke="#9e9e9e" strokeWidth="1.4" />
                          <path d="M8 8v2.667" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />
                          <circle cx="8" cy="5.333" r="0.5" fill="#9e9e9e" />
                        </svg>
                        <AnimatePresence>
                          {showHeadersTip && (
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
                      </div>                                                                </div>                    <div className="flex flex-col" style={{ marginTop: 8, gap: 16 }}>                      <div style={{ display: "flex", alignItems: "center", height: 40, borderRadius: 8, border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", backgroundColor: isDark ? "#0c0c0c" : "#fafafa", padding: "0 12px" }}>                        <span style={{ fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#8c8c8c" : "#5b5b5b" }}>Authorization</span>                      </div>                      <div style={{ display: "flex", alignItems: "center", height: 40, borderRadius: 8, border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", backgroundColor: isDark ? "#212121" : "#ffffff", padding: "0 12px" }}>                        <input type="text" placeholder="Bearer SK-____" value={headerBearer} onChange={(e) => setHeaderBearer(e.target.value)} className="placeholder:text-[#9e9e9e]" style={{ flex: 1, background: "transparent", outline: "none", border: "none", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#c7c7c7" : "#6e6d6d" }} />                      </div>                      <div style={{ display: "flex", alignItems: "center", height: 40, borderRadius: 8, border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", backgroundColor: isDark ? "#212121" : "#ffffff", padding: "0 12px" }}>                        <input type="text" placeholder="Key" value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} className="placeholder:text-[#9e9e9e]" style={{ flex: 1, background: "transparent", outline: "none", border: "none", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#c7c7c7" : "#6e6d6d" }} />                      </div>                      <div style={{ display: "flex", alignItems: "center", height: 40, borderRadius: 8, border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", backgroundColor: isDark ? "#212121" : "#ffffff", padding: "0 12px" }}>                        <input type="text" placeholder="Value" value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} className="placeholder:text-[#9e9e9e]" style={{ flex: 1, background: "transparent", outline: "none", border: "none", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#c7c7c7" : "#6e6d6d" }} />                      </div>                    </div>                  </div>                </motion.div>              )}            </AnimatePresence>              {headerExpanded && (                <div style={{ position: "absolute", top: -8, right: 4, cursor: "pointer", zIndex: 5 }} onClick={() => setHeaderExpanded(false)}>                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">                    <circle cx="9" cy="9" r="7.5" stroke="#9e9e9e" strokeWidth="1.4" />                    <path d="M6.75 6.75l4.5 4.5" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />                    <path d="M11.25 6.75l-4.5 4.5" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />                  </svg>                </div>              )}            </div>          </motion.div>          <motion.div variants={cardItemVariants} className="flex items-center" style={{ gap: 16, justifyContent: "center" }}>            {[{ label: "Test a GET", demo: demoRequests["Test a GET"] }, { label: "Test a POST", demo: demoRequests["Test a POST"] }].map(({ label, demo }) => (              <button key={label} onClick={() => { setMethod(demo.method); setUrl(demo.url); onSend({ method: demo.method, url: demo.url }); }} className="flex items-center justify-center" style={{ borderRadius: 6, border: isDark ? "0.8px solid #202020" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#0f0f0f" : "#ffffff", padding: "6px 8px" }}>                <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: isDark ? "#8c8c8c" : "#5a5a5a" }}>{label}</span>              </button>            ))}            <button onClick={() => setShowHistory(true)} className="flex items-center justify-center" style={{ borderRadius: 6, border: isDark ? "0.8px solid #202020" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#0f0f0f" : "#ffffff", padding: "6px 8px" }}>              <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: isDark ? "#8c8c8c" : "#5a5a5a" }}>View history</span>            </button>          </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showHistory && (        <MobileHistoryModal          isDark={isDark}          onClose={() => setShowHistory(false)}          history={history}          onSelect={(item, i) => {            setShowHistory(false);
            onHistorySelect(item, i);
           }}        />      )}
      <AnimatePresence>
        {showCheatSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowCheatSheet(false); setCleanSheetDismissed(true); window.localStorage.setItem("cleanSheetDismissed", "1"); }}
              style={{ position: "fixed", inset: 0, zIndex: 90, background: "linear-gradient(-113.5deg, rgba(180,180,180,0.47), rgba(230,230,230,0))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 350, damping: 26, mass: 0.7 }}
              style={{ position: "fixed", left: 39, top: 237, width: 297, height: 339, backgroundColor: "#fff", borderRadius: 10, zIndex: 100, overflow: "hidden" }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, width: 297, height: 64, background: "url('/cheat sheet rectangle.png') center/cover no-repeat" }} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{ position: "absolute", left: 260.84, top: 6.97, width: 24, height: 25, cursor: "pointer" }}
                onClick={() => { setShowCheatSheet(false); setCleanSheetDismissed(true); window.localStorage.setItem("cleanSheetDismissed", "1"); }}
              >
                <svg width="19.5" height="19.5" viewBox="0 0 19.5 19.5" style={{ position: "absolute", left: 2.5, top: 3.28 }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M13.211 12.13903l-1.061 1.061-2.401-2.399-2.4 2.396-1.06-1.061 2.399-2.395-2.399-2.398 1.061-1.06103 2.4 2.39903 2.401-2.39703 1.06 1.06203-2.4 2.395 2.4 2.398z m-3.461-12.13903c-5.376 0-9.75 4.374-9.75 9.75003 0 5.376 4.374 9.75 9.75 9.75 5.376 0 9.75-4.374 9.75-9.75 0-5.37603-4.374-9.75003-9.75-9.75003z" fill="#fff" />
                </svg>
              </motion.div>
              <span style={{ position: "absolute", left: 12, top: 76, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.8px", color: "#616161" }}>cheat sheet</span>
              <motion.div
                variants={{ visible: { transition: { staggerChildren: 0.02, delayChildren: 0.08 } } }}
                initial="hidden"
                animate="visible"
                style={{ position: "absolute", left: 12, top: 109, width: 273, height: 218, borderRadius: 8, border: "0.8px solid #f2f2f2", backgroundColor: "#fff", padding: 12, overflow: "hidden" }}
              >
                <motion.p variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ margin: 0, marginBottom: 16, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, lineHeight: 1.45, letterSpacing: "-0.4px", color: "#737373" }}>
                  <span style={{ fontWeight: 500 }}>Headers</span> – What they are, why servers care
                </motion.p>
                <motion.p variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ margin: 0, marginBottom: 16, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, lineHeight: 1.45, letterSpacing: "-0.4px", color: "#737373" }}>
                  <span style={{ fontWeight: 500 }}>Authorization</span> – The specific header that gates access on most API
                </motion.p>
                <motion.p variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ margin: 0, marginBottom: 16, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, lineHeight: 1.45, letterSpacing: "-0.4px", color: "#737373" }}>
                  <span style={{ fontWeight: 500 }}>Bearer Token</span> – why it's just a string, no password flow
                </motion.p>
                <motion.p variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ margin: 0, marginBottom: 0, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, lineHeight: 1.45, letterSpacing: "-0.4px", color: "#737373" }}>
                  <span style={{ fontWeight: 500 }}>API key/ SL prefix</span> – treat-it- like a password framing since this is a real security habit worth planting early
                </motion.p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}function MobileHistoryModal({ isDark, onClose, history, onSelect }: { isDark: boolean;
 onClose: () => void;
 history: any[];
 onSelect: (item: any, index: number) => void }) {  const todayKey = new Date().toDateString();
  const isTodayItem = (t: number) => new Date(t).toDateString() === todayKey;
  const recentHistory = history.slice(0, 50);
  const hasOlderHistory = recentHistory.some((item) => !isTodayItem(item.timestamp));
  const todayRows = recentHistory.filter((item) => isTodayItem(item.timestamp)).length;
  const olderRows = recentHistory.length - todayRows;
  const modalHeight =    history.length === 0      ? 413      : Math.min(413, 67 + 16 + (todayRows ? 12 + todayRows * 38 + (todayRows - 1) * 12 : 0) + (hasOlderHistory ? 16 + 12 + olderRows * 38 + (olderRows - 1) * 12 : 0) + 16);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const width = Math.min(573, (typeof window !== "undefined" ? window.innerWidth : 375) - 32);
  const row = (item: any, i: number) => (    <div key={i} className="flex items-center" style={{ gap: 8, borderRadius: 6, padding: "10px 16px", cursor: "pointer", backgroundColor: isDark ? (hoveredRow === i ? "#1f1f1f" : "#0f0f0f") : (hoveredRow === i ? "#f7f7f7" : "#ffffff") }} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} onClick={() => onSelect(item, i)}>      <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: methodDots[item.method] ?? "#008000", flexShrink: 0 }} />      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.7px", color: isDark ? (hoveredRow === i ? "#f7f7f7" : "#adadad") : "#636363", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.url}</span>    </div>  );
  return (    <div className="fixed" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 60, width, height: modalHeight, borderRadius: 10, backgroundColor: isDark ? "#0f0f0f" : "#ffffff", ...(isDark ? {} : { border: "0.8px solid #f2f2f2" }) }}>      <div className="flex items-center" style={{ position: "absolute", left: 16, top: 16, gap: 8 }}>        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">          <circle cx="8.825" cy="8.825" r="6.741" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />          <path d="M13.514 13.864l2.643 2.636" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />        </svg>        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, letterSpacing: "-0.8px", color: "#999999" }}>Search....</span>      </div>      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ position: "absolute", right: 16, top: 17, cursor: "pointer" }} onClick={onClose}>        <circle cx="9" cy="9" r="7.5" stroke="#9e9e9e" strokeWidth="1.4" />        <path d="M6 6l6 6M12 6l-6 6" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />      </svg>      <div style={{ position: "absolute", left: 16, top: 51, right: 16, height: 0.8, backgroundColor: isDark ? "#2d2d2d" : "#f2f2f2" }} />      <div className="hide-scrollbar" style={{ position: "absolute", left: 16, top: 67, right: 16, bottom: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>        {history.length === 0 ? (          <div className="flex flex-col items-center" style={{ gap: 12, paddingTop: 66 }}>            <img src="/history-empty.png" alt="" style={{ width: 70, height: 70 }} />            <div className="flex flex-col items-center" style={{ gap: 8 }}>              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isDark ? "#f7f7f7" : "#696969" }}>No requests yet</span>              <span style={{ width: 280, textAlign: "center", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.56px", lineHeight: "20px", color: isDark ? "#adadad" : "#939393" }}>Try one of the demo buttons above, or send your first request.</span>            </div>          </div>        ) : (          <>            <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858" }}>Today</span>            {recentHistory.map((item, i) => (isTodayItem(item.timestamp) ? row(item, i) : null))}            {hasOlderHistory && (              <>                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858" }}>Previous 30 days</span>                {recentHistory.map((item, i) => (!isTodayItem(item.timestamp) ? row(item, i) : null))}              </>            )}          </>        )}      </div>    </div>  );
}function ExplorerCard({ activeTheme, apisTested, streak, lowestLatency }: { activeTheme: string;
 apisTested: number;
 streak: number;
 lowestLatency: number | null }) {  const isDark = activeTheme === "Dark";
  const streakLabel = `${streak} ${streak === 1 ? "day" : "days"} streak`;
  return (    <motion.div      className="absolute"      style={{ bottom: 0, left: 0, zIndex: 10, width: 241, height: 229, borderRadius: 12, backgroundColor: isDark ? "#0f0f0f" : "#ffffff", border: isDark ? "0.8px solid #312f2f" : "none", pointerEvents: "none" }}      initial={{ opacity: 0, y: 8, scale: 0.97 }}      animate={{ opacity: 1, y: 0, scale: 1 }}      exit={{ opacity: 0, y: 8, scale: 0.97 }}      transition={{ duration: 0.18, ease: "easeOut" }}    >      <div style={{ position: "absolute", top: 12, left: 12, width: 54, height: 54, borderRadius: 8, overflow: "hidden" }}>        <img          src="/Explorer%20image.jpg"          alt=""          style={{ width: "100%", height: "100%", objectFit: "cover" }}          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}        />      </div>      <span style={{ position: "absolute", top: 16, left: 74, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isDark ? "#f7f7f7" : "#4f4f4f", whiteSpace: "nowrap" }}>Explorer #1</span>      <div style={{ position: "absolute", top: 38, left: 74, display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", borderRadius: 8, backgroundColor: isDark ? "#3a1212" : "#ffe7e7" }}>        <svg viewBox="0 0 16 16" style={{ width: 16, height: 16 }}>          <path d="M7 0c0.66667 2.66667 2 4.83333 4 6.5 2 1.66667 3 3.5 3 5.5 0 1.85652-0.7375 3.63699-2.05025 4.94975-1.31276 1.31275-3.09323 2.05025-4.94975 2.05025-1.85652 0-3.63699-0.7375-4.94975-2.05025-1.31275-1.31275-2.05025-3.09323-2.05025-4.94975 0-1.08185 0.35089-2.13452 1-3 0 0.66304 0.26339 1.29893 0.73223 1.76777 0.46884 0.46884 1.10473 0.73223 1.76777 0.73223 0.66304 0 1.29893-0.26339 1.76777-0.73223 0.46884-0.46884 0.73223-1.10473 0.73223-1.76777 0-2-1.5-3-1.5-5 0-1.33333 0.83333-2.66667 2.5-4z" fill="#ff3636" transform="translate(3.3333 2) scale(0.6667)" />        </svg>        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: "#ff3636", whiteSpace: "nowrap" }}>{streakLabel}</span>      </div>      <div style={{ position: "absolute", top: 78, left: 12, width: 217, height: 111, borderRadius: 8, backgroundColor: isDark ? "#1b1b1b" : "#ffffff", border: `0.8px solid ${isDark ? "#2d2d2d" : "#f2f2f2"}` }}>        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#4f4f4f" }}>Stats</span>        <div style={{ position: "absolute", top: 36, left: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: "#a0a0ff" }} />        <span style={{ position: "absolute", top: 32, left: 16, fontSize: 14, letterSpacing: "-0.7px", color: isDark ? "#adadad" : "#737373" }}>{apisTested} APIs tested</span>        <div style={{ position: "absolute", top: 58, left: 8, width: 174, height: 0, borderTop: `0.8px solid ${isDark ? "#2d2d2d" : "#f2f2f2"}` }} />        <div style={{ position: "absolute", top: 70, left: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: "#a0a0ff" }} />        <span style={{ position: "absolute", top: 66, left: 16, fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isDark ? "#ffffff" : "#3a3a3a" }}>{lowestLatency !== null ? `${lowestLatency}ms` : "--"}</span>        <span style={{ position: "absolute", top: 66, left: 57, fontSize: 14, letterSpacing: "-0.7px", color: isDark ? "#adadad" : "#737373" }}>is the lowest latency you</span>        <span style={{ position: "absolute", top: 85, left: 16, fontSize: 14, letterSpacing: "-0.7px", color: isDark ? "#adadad" : "#737373" }}>have hit</span>      </div>      <div style={{ position: "absolute", top: 201, left: 76, display: "flex", alignItems: "center", gap: 4 }}>        <span style={{ fontSize: 12, letterSpacing: "-0.6px", color: isDark ? "#adadad" : "#737373" }}>Built with love</span>        <svg viewBox="0 0 16 16" style={{ width: 16, height: 16 }}>          <path d="M15.65387 7.68097l-0.025 0c-0.414-0.015-0.739-0.361-0.725-0.77502 0.032-0.951-0.433-1.568-1.244-1.651-0.412-0.042-0.712-0.41-0.67-0.822 0.043-0.411 0.413-0.714 0.823-0.67 1.608 0.164 2.649 1.447 2.59 3.193-0.014 0.40602-0.347 0.72502-0.749 0.72502z m-0.082-7.41402c-1.72-0.55-4.101-0.322-5.587 1.364-1.561-1.674-3.86101-1.917-5.56901-1.363-3.915 1.26-5.136 5.796-4.022 9.27502 1.758 5.471 7.60301 8.423 9.60501 8.423 1.787 0 7.864-2.896 9.602-8.423 1.114-3.47802-0.11-8.01402-4.029-9.27602z" fill="#ff3636" fillRule="evenodd" transform="translate(1.50195 2.01135) scale(0.6667)" />        </svg>      </div>    </motion.div>  );
}function Sidebar({  activeTheme,  onThemeChange,  history,  activeHistoryIndex,  onSelect,  onRetry,  compact,}: {  activeTheme: string;
  compact: boolean;
  onThemeChange: (t: string) => void;
  history: any[];
  activeHistoryIndex: number | null;
  onSelect: (item: any, index: number) => void;
  onRetry: (item: any) => void;
}) {  return (    <div className={`flex h-full ${compact ? "w-[196px]" : "w-[212px]"} shrink-0 flex-col`}>      <div className="flex shrink-0 items-center px-4 pt-4">        <span          className={`text-sm font-medium ${activeTheme === "Dark" ? "text-white" : "text-[#585858]"}`}          style={{ fontFamily: "Geist, var(--font-geist-sans)", fontWeight: 500, letterSpacing: "-0.7px" }}        >          Explorer Log        </span>        <div className="ml-auto flex h-4 w-4 items-center justify-center">          <div style={{ height: 16, overflow: "hidden", position: "relative", width: 16 }}>            <svg viewBox="-1e-6 -2e-6 19.285 20.721" preserveAspectRatio="none" style={{ height: 13.814, left: 1.333, overflow: "visible", position: "absolute", top: 1.334, width: 12.857 }}>              <path                d="M10.267 0c.716 0 1.412.294 1.911.805.498.514.773 1.219.752 1.934.002.161.055.347.151.51.159.27.41.46.708.538.298.074.61.034.875-.123 1.28-.731 2.909-.293 3.64.977l.623 1.079c.016.029.03.057.042.086.662 1.251.22 2.826-1.01 3.545-.179.103-.324.247-.424.421-.155.269-.198.589-.12.883.08.3.271.549.54.703.607.349 1.06.937 1.241 1.616.181.678.082 1.414-.271 2.021l-.664 1.106c-.731 1.256-2.36 1.691-3.627.959-.169-.097-.364-.15-.558-.155h-.006c-.289 0-.586.123-.802.338-.219.219-.339.511-.337.821-.007 1.469-1.202 2.657-2.664 2.657h-1.253c-1.469 0-2.664-1.194-2.664-2.663-.002-.181-.054-.369-.151-.532-.157-.274-.411-.47-.704-.548-.291-.078-.61-.035-.872.117-.628.35-1.367.435-2.043.245-.675-.191-1.258-.655-1.6-1.27l-.625-1.077c-.731-1.268-.296-2.893.97-3.625.359-.207.582-.593.582-1.007 0-.414-.223-.801-.582-1.008-1.267-.736-1.701-2.365-.971-3.633l.678-1.113c.721-1.254 2.351-1.696 3.622-.966.173.103.361.155.552.157.623 0 1.144-.514 1.154-1.146-.004-.697.271-1.366.772-1.871.503-.504 1.171-.781 1.882-.781h1.253zm0 1.5h-1.253c-.31 0-.6.121-.819.339-.218.219-.337.51-.335.82-.021 1.462-1.216 2.639-2.663 2.639-.464-.005-.911-.13-1.299-.362-.545-.31-1.257-.119-1.576.436l-.677 1.113c-.31.538-.12 1.249.432 1.57.819.474 1.33 1.358 1.33 2.306 0 .948-.511 1.831-1.332 2.306-.549.318-.739 1.025-.421 1.575l.631 1.088c.156.281.411.484.706.567.294.082.618.047.888-.103.397-.233.859-.354 1.323-.354.229 0 .458.029.682.089.676.182 1.263.634 1.611 1.241.226.381.351.826.355 1.28 0 .65.522 1.171 1.164 1.171h1.253c.639 0 1.161-.518 1.164-1.157-.004-.706.272-1.377.777-1.882.498-.498 1.194-.797 1.89-.777.456.011.895.134 1.282.354.557.319 1.268.129 1.59-.421l.664-1.107c.148-.255.191-.575.112-.87-.078-.295-.274-.551-.538-.702-.618-.356-1.059-.93-1.242-1.618-.181-.675-.082-1.412.271-2.019.23-.4.567-.737.971-.969.542-.317.732-1.026.417-1.578l-.035-.069-.586-1.016c-.319-.555-1.029-.746-1.586-.429-.602.356-1.318.458-2.006.277-.687-.178-1.263-.613-1.622-1.227-.23-.384-.355-.831-.359-1.286.009-.342-.111-.649-.329-.874-.217-.224-.522-.351-.835-.351zm-.622 5.474c1.867 0 3.386 1.52 3.386 3.387s-1.519 3.385-3.386 3.385-3.386-1.518-3.386-3.385 1.519-3.387 3.386-3.387zm0 1.5c-1.04 0-1.886.847-1.886 1.887s.846 1.885 1.886 1.885 1.886-.845 1.886-1.885-.846-1.887-1.886-1.887z"                fill="#585858"                fillRule="evenodd"              />            </svg>          </div>        </div>      </div>      <div className="flex flex-1 flex-col overflow-y-auto" style={{ minHeight: 0 }}>        {history.length === 0 ? (        <div className="flex flex-1 flex-col items-center justify-center">        <div className="flex flex-col items-center gap-3" style={{ paddingLeft: 12, paddingRight: 12 }}>          <div style={{ boxSizing: "border-box", flexShrink: 0, height: 32, overflow: "hidden", position: "relative", width: 32 }}>            <svg viewBox="0 0 37.5801 16.5399" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 4.268, left: 11.099, overflow: "visible", position: "absolute", top: 19.12, width: 9.698, zIndex: 0 }}>              <path d="M36.76 0.4099c0.33-0.07 0.6101-0.1999 0.8201-0.4099l-0.8201 0.4099z m-36.76 16.13c0.24-0.07 0.4599-0.18 0.6399-0.32l-0.6399 0.32z" fill="#5b5bff" />              <path d="M36.76 0.4099c0.33-0.07 0.6101-0.1999 0.8201-0.4099l-0.8201 0.4099z m-36.76 16.13c0.24-0.07 0.4599-0.18 0.6399-0.32l-0.6399 0.32z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />            </svg>            <svg viewBox="0 0 17.1902 2.6" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 1, left: 16.361, overflow: "visible", position: "absolute", top: 18.555, width: 4.436, zIndex: 1 }}>              <path d="M0 0.39l0.7901-0.39m15.5801 2.6c0.33-0.07 0.61-0.1999 0.82-0.40991l-0.82 0.40991z" fill="#5b5bff" />              <path d="M0 0.39l0.7901-0.39m15.5801 2.6c0.33-0.07 0.61-0.1999 0.82-0.40991l-0.82 0.40991z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />            </svg>            <svg viewBox="-1.9e-6 -2.1e-6 36.9899 47.6745" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 12.303, left: 13.308, overflow: "visible", position: "absolute", top: 19.158, width: 9.546, zIndex: 2 }}>              <path d="M36.9799 34.12379c-0.07-5.75-1.8801-11.6701-5.4001-17.7501-3.25-5.6-7.0998-9.8699-11.5698-12.8199-0.5-0.33-1.0101-0.64-1.5201-0.94-2.09-1.21-4.0501-1.9901-5.8901-2.37011-2.3-0.46-4.4-0.2699-6.3 0.5801l-0.8899 0.43991c-0.06 0.03-0.12 0.07-0.18 0.11-3.27 1.95-5.0099 5.5301-5.2099 10.73009-0.01 0.34-0.02 0.6899-0.02 1.04991 0 5.88 1.7999 11.92 5.4099 18.1401 3.6 6.23 7.96 10.81 13.08 13.77 5.12 2.95 9.4799 3.4 13.0899 1.35 3.6-2.06 5.41009-6.03 5.41009-11.9 0-0.13 0-0.26 0-0.39l-0.00999 0z m-11.09 2.47999c-0.37 0.21-0.8001 0.17001-1.2901-0.11999-0.5-0.28-0.93-0.74001-1.3-1.38001l-5.5498-9.5701c-0.37-0.64-0.6501-1.28-0.8301-1.90999-0.19-0.64-0.28-1.2399-0.28-1.8099l0-9.6601c0-0.56 0.19-0.95 0.56-1.16001 0.37-0.21 0.8-0.1799 1.29 0.1101 0.49 0.28 0.9299 0.75 1.2999 1.38001 0.37 0.64 0.55 1.2399 0.55 1.8099l0 9.7601 5.5501 9.57c0.37 0.64 0.55 1.24 0.55 1.80999 0 0.57-0.18 0.95-0.55 1.17z" fill="#5b5bff" />              <path d="M36.9799 34.12379c-0.07-5.75-1.8801-11.6701-5.4001-17.7501-3.25-5.6-7.0998-9.8699-11.5698-12.8199-0.5-0.33-1.0101-0.64-1.5201-0.94-2.09-1.21-4.0501-1.9901-5.8901-2.37011-2.3-0.46-4.4-0.2699-6.3 0.5801l-0.8899 0.43991c-0.06 0.03-0.12 0.07-0.18 0.11-3.27 1.95-5.0099 5.5301-5.2099 10.73009-0.01 0.34-0.02 0.6899-0.02 1.04991 0 5.88 1.7999 11.92 5.4099 18.1401 3.6 6.23 7.96 10.81 13.08 13.77 5.12 2.95 9.4799 3.4 13.0899 1.35 3.6-2.06 5.41009-6.03 5.41009-11.9 0-0.13 0-0.26 0-0.39l-0.00999 0z m-11.09 2.47999c-0.37 0.21-0.8001 0.17001-1.2901-0.11999-0.5-0.28-0.93-0.74001-1.3-1.38001l-5.5498-9.5701c-0.37-0.64-0.6501-1.28-0.8301-1.90999-0.19-0.64-0.28-1.2399-0.28-1.8099l0-9.6601c0-0.56 0.19-0.95 0.56-1.16001 0.37-0.21 0.8-0.1799 1.29 0.1101 0.49 0.28 0.9299 0.75 1.2999 1.38001 0.37 0.64 0.55 1.2399 0.55 1.8099l0 9.7601 5.5501 9.57c0.37 0.64 0.55 1.24 0.55 1.80999 0 0.57-0.18 0.95-0.55 1.17z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />            </svg>            <svg viewBox="-2.1e-7 -2.1e-6 9.8 25.8785" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 6.678, left: 17.602, overflow: "visible", position: "absolute", top: 21.96, width: 2.529, zIndex: 3 }}>              <path d="M9.8 24.57624c0 0.57-0.18 0.95-0.55 1.17-0.37 0.21-0.8001 0.17-1.2901-0.11999-0.5-0.28-0.93-0.74001-1.3-1.38001l-5.5498-9.5701c-0.37-0.64-0.6501-1.28-0.8301-1.90999-0.19-0.64-0.28-1.2399-0.28-1.8099l0-9.6601c0-0.56 0.19-0.95 0.56-1.16001 0.37-0.21 0.8001-0.1799 1.2901 0.1101 0.49 0.28 0.9298 0.75 1.2998 1.38001 0.37 0.64 0.55 1.2399 0.55 1.8099l0 9.76 5.5501 9.5701c0.37 0.64 0.55 1.24 0.55 1.80999z" fill="#5b5bff" />              <path d="M9.8 24.57624c0 0.57-0.18 0.95-0.55 1.17-0.37 0.21-0.8001 0.17-1.2901-0.11999-0.5-0.28-0.93-0.74001-1.3-1.38001l-5.5498-9.5701c-0.37-0.64-0.6501-1.28-0.8301-1.90999-0.19-0.64-0.28-1.2399-0.28-1.8099l0-9.6601c0-0.56 0.19-0.95 0.56-1.16001 0.37-0.21 0.8001-0.1799 1.2901 0.1101 0.49 0.28 0.9298 0.75 1.2998 1.38001 0.37 0.64 0.55 1.2399 0.55 1.8099l0 9.76 5.5501 9.5701c0.37 0.64 0.55 1.24 0.55 1.80999z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />            </svg>            <svg viewBox="-2.9e-6 -1.9e-6 50.6902 52.3901" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 13.52, left: 14.936, overflow: "visible", position: "absolute", top: 17.615, width: 13.081, zIndex: 4 }}>              <path d="M50.6802 30.49c0 5.8701-1.8102 9.8401-5.4102 11.9001l-0.8899 0.43999-19.1101 9.56001c3.6-2.06 5.4102-6.03 5.4102-11.9 0-0.13 0-0.26 0-0.39-0.07-5.75-1.8802-11.6701-5.4002-17.7501-3.25-5.6-7.0998-9.87-11.5698-12.82-0.5-0.33-1.01-0.6399-1.52-0.9399-2.09-1.21-4.0501-1.9901-5.8901-2.37011-2.3-0.46-4.4001-0.27-6.3001 0.58001l5.53-2.77 0.7901-0.39 6.4199-3.21c0.75 0.45 1.51 0.93999 2.25 1.46999 0.23 0.15 0.4502 0.31 0.6702 0.47001 1.14 0.83 2.23 1.73 3.28 2.69 1.05 0.96 2.04 1.35 2.96 1.18 0.33-0.07 0.61-0.1999 0.82-0.40991l0.0298-0.02009 11.6401-5.81c4.18 2.92 7.8099 7.04 10.8899 12.35 3.6 6.22 5.4102 12.27 5.4102 18.14l-0.01 0z" fill="#5b5bff" />              <path d="M50.6802 30.49c0 5.8701-1.8102 9.8401-5.4102 11.9001l-0.8899 0.43999-19.1101 9.56001c3.6-2.06 5.4102-6.03 5.4102-11.9 0-0.13 0-0.26 0-0.39-0.07-5.75-1.8802-11.6701-5.4002-17.7501-3.25-5.6-7.0998-9.87-11.5698-12.82-0.5-0.33-1.01-0.6399-1.52-0.9399-2.09-1.21-4.0501-1.9901-5.8901-2.37011-2.3-0.46-4.4001-0.27-6.3001 0.58001l5.53-2.77 0.7901-0.39 6.4199-3.21c0.75 0.45 1.51 0.93999 2.25 1.46999 0.23 0.15 0.4502 0.31 0.6702 0.47001 1.14 0.83 2.23 1.73 3.28 2.69 1.05 0.96 2.04 1.35 2.96 1.18 0.33-0.07 0.61-0.1999 0.82-0.40991l0.0298-0.02009 11.6401-5.81c4.18 2.92 7.8099 7.04 10.8899 12.35 3.6 6.22 5.4102 12.27 5.4102 18.14l-0.01 0z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />            </svg>            <svg viewBox="-2.6e-6 -3.5e-6 66.5898 78.5897" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 20.281, left: 3.76, overflow: "visible", position: "absolute", top: 3.13, width: 17.184, zIndex: 5 }}>              <path d="M66.19994 42.75c-0.15-0.59-0.3401-1.1899-0.5801-1.7899-0.49-1.24-1.1199-2.4201-1.8999-3.5401-0.26-0.38-0.54-0.75-0.83-1.11l-6.5-8.04-19.3899-24c-0.56-0.68-1.1501-1.3-1.7601-1.86-0.62-0.57-1.2701-1.0499-1.9401-1.4399-0.68-0.4-1.3099-0.6501-1.8999-0.7801-0.59-0.13-1.1901-0.19-1.8001-0.19l-9.5998 0.79-16.30009 1.34c-0.39 0.03-0.75008 0.11-1.08008 0.24l-0.03003 0c-0.11 0.05-0.21983 0.1-0.32983 0.16-0.51 0.25-0.94004 0.62-1.29004 1.11-0.64 0.89-0.96997 2.1201-0.96997 3.6801l0 33.75c0 1.55 0.32997 3.1499 0.96997 4.7999 0.65 1.65 1.55998 3.19999 2.72998 4.65l21.17989 26.24c1.23 1.49 2.4201 2.07 3.5601 1.74l0.6399-0.32c0.66-0.53 0.9002-1.55 0.7002-3.05-0.12-0.63-0.1802-1.29001-0.1802-1.96l0-2.18c0-7.35 2.0201-12.56 6.0801-15.63 0.47-0.37 0.97-0.7 1.5-1 3.82-2.17 8.23-2.3499 13.23-0.5299 1.63 0.58 3.32 1.3899 5.08 2.3999 0.18 0.11 0.3699 0.21 0.5499 0.33 0.75 0.45 1.51 0.94 2.25 1.47 0.23 0.15 0.4501 0.31 0.6701 0.47 1.14 0.83 2.23 1.73 3.28 2.69 1.05 0.96 2.04001 1.35 2.96 1.18l0.8201-0.4099 0.0298-0.0201c0.36-0.37 0.54-0.9499 0.54-1.7399l0-14.4401c0-0.98-0.1299-1.99-0.3899-3.01z m-8.6699 1.42c-0.02 0.21-0.0501 0.41-0.1001 0.61-0.24 1.02-0.7999 1.57-1.6599 1.63l-1.4302 0.12-17.3398 1.46c-0.56 0.03-1.1501-0.0199-1.7601-0.1599-0.62-0.15-1.2701-0.4201-1.9401-0.8101-0.68-0.39-1.33-0.8699-1.95-1.4399-0.61-0.56-1.2-1.19-1.75-1.86l-9.5698-11.88-9.1101-11.3201c-0.87-1.07-1.44-2.26-1.72-3.59-0.27-1.33-0.1699-2.34 0.3301-3.05 0.49-0.71 1.23-0.92 2.22-0.63 0.98 0.29 1.91 0.96 2.77 2.03l5.48 6.78 13.2998 16.47 18.77-1.5699c0.86-0.07 1.79 0.3199 2.77 1.1699 0.99 0.86 1.73 1.9201 2.22 3.1901 0.4 1.03 0.5602 1.9799 0.4702 2.8499z" fill="#5b5bff" />              <path d="M66.19994 42.75c-0.15-0.59-0.3401-1.1899-0.5801-1.7899-0.49-1.24-1.1199-2.4201-1.8999-3.5401-0.26-0.38-0.54-0.75-0.83-1.11l-6.5-8.04-19.3899-24c-0.56-0.68-1.1501-1.3-1.7601-1.86-0.62-0.57-1.2701-1.0499-1.9401-1.4399-0.68-0.4-1.3099-0.6501-1.8999-0.7801-0.59-0.13-1.1901-0.19-1.8001-0.19l-9.5998 0.79-16.30009 1.34c-0.39 0.03-0.75008 0.11-1.08008 0.24l-0.03003 0c-0.11 0.05-0.21983 0.1-0.32983 0.16-0.51 0.25-0.94004 0.62-1.29004 1.11-0.64 0.89-0.96997 2.1201-0.96997 3.6801l0 33.75c0 1.55 0.32997 3.1499 0.96997 4.7999 0.65 1.65 1.55998 3.19999 2.72998 4.65l21.17989 26.24c1.23 1.49 2.4201 2.07 3.5601 1.74l0.6399-0.32c0.66-0.53 0.9002-1.55 0.7002-3.05-0.12-0.63-0.1802-1.29001-0.1802-1.96l0-2.18c0-7.35 2.0201-12.56 6.0801-15.63 0.47-0.37 0.97-0.7 1.5-1 3.82-2.17 8.23-2.3499 13.23-0.5299 1.63 0.58 3.32 1.3899 5.08 2.3999 0.18 0.11 0.3699 0.21 0.5499 0.33 0.75 0.45 1.51 0.94 2.25 1.47 0.23 0.15 0.4501 0.31 0.6701 0.47 1.14 0.83 2.23 1.73 3.28 2.69 1.05 0.96 2.04001 1.35 2.96 1.18l0.8201-0.4099 0.0298-0.0201c0.36-0.37 0.54-0.9499 0.54-1.7399l0-14.4401c0-0.98-0.1299-1.99-0.3899-3.01z m-8.6699 1.42c-0.02 0.21-0.0501 0.41-0.1001 0.61-0.24 1.02-0.7999 1.57-1.6599 1.63l-1.4302 0.12-17.3398 1.46c-0.56 0.03-1.1501-0.0199-1.7601-0.1599-0.62-0.15-1.2701-0.4201-1.9401-0.8101-0.68-0.39-1.33-0.8699-1.95-1.4399-0.61-0.56-1.2-1.19-1.75-1.86l-9.5698-11.88-9.1101-11.3201c-0.87-1.07-1.44-2.26-1.72-3.59-0.27-1.33-0.1699-2.34 0.3301-3.05 0.49-0.71 1.23-0.92 2.22-0.63 0.98 0.29 1.91 0.96 2.77 2.03l5.48 6.78 13.2998 16.47 18.77-1.5699c0.86-0.07 1.79 0.3199 2.77 1.1699 0.99 0.86 1.73 1.9201 2.22 3.1901 0.4 1.03 0.5602 1.9799 0.4702 2.8499z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />            </svg>            <svg viewBox="-5.9e-6 -2.1e-6 48.5008 34.8745" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 9, left: 6.096, overflow: "visible", position: "absolute", top: 6.517, width: 12.516, zIndex: 6 }}>              <path d="M48.47641 31.04625c-0.02 0.21-0.0501 0.41-0.1001 0.61-0.24 1.02-0.7999 1.57-1.6599 1.63l-1.4302 0.12-17.33979 1.4599c-0.56 0.03-1.15-0.0199-1.76-0.1599-0.62-0.15-1.2702-0.42-1.94021-0.81-0.68-0.39-1.33-0.87-1.94999-1.44-0.61-0.56-1.2-1.19-1.75-1.86l-9.56981-11.88-9.11009-11.32c-0.87-1.07-1.44-2.26-1.72001-3.59-0.27-1.33-0.1699-2.3401 0.33011-3.0501 0.49-0.71 1.23-0.92 2.22-0.63 0.98 0.29 1.91 0.9601 2.76999 2.0301l5.48 6.78 13.2998 16.47 18.77-1.57c0.86-0.07 1.79 0.3199 2.77 1.1699 0.99 0.86 1.73 1.9201 2.22 3.1901 0.4 1.03 0.5602 1.98 0.4702 2.85z" fill="#5b5bff" />              <path d="M48.47641 31.04625c-0.02 0.21-0.0501 0.41-0.1001 0.61-0.24 1.02-0.7999 1.57-1.6599 1.63l-1.4302 0.12-17.33979 1.4599c-0.56 0.03-1.15-0.0199-1.76-0.1599-0.62-0.15-1.2702-0.42-1.94021-0.81-0.68-0.39-1.33-0.87-1.94999-1.44-0.61-0.56-1.2-1.19-1.75-1.86l-9.56981-11.88-9.11009-11.32c-0.87-1.07-1.44-2.26-1.72001-3.59-0.27-1.33-0.1699-2.3401 0.33011-3.0501 0.49-0.71 1.23-0.92 2.22-0.63 0.98 0.29 1.91 0.9601 2.76999 2.0301l5.48 6.78 13.2998 16.47 18.77-1.57c0.86-0.07 1.79 0.3199 2.77 1.1699 0.99 0.86 1.73 1.9201 2.22 3.1901 0.4 1.03 0.5602 1.98 0.4702 2.85z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />            </svg>            <svg viewBox="-2.9e-6 2e-6 21.3301 25.5931" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 6.605, left: 11.264, overflow: "visible", position: "absolute", top: 16.701, width: 5.505, zIndex: 7 }}>              <path d="M21.3301 1.24314c-0.46 1.78-0.72 3.75-0.79 5.93l-0.7901 0.4-5.53 2.77-0.8899 0.4399c-0.06 0.03-0.1199 0.07-0.1799 0.11-3.27 1.95-5.01 5.53009-5.21 10.7301l-7.9402 3.97c0.66-0.53 0.9002-1.55 0.7002-3.05-0.12-0.63-0.1801-1.29001-0.1801-1.96001l0-2.1801c0-7.35 2.02-12.56 6.08-15.62999 0.47-0.37 0.97-0.7 1.5-1 3.82-2.17 8.23-2.3499 13.23-0.5299z" fill="#5b5bff" />              <path d="M21.3301 1.24314c-0.46 1.78-0.72 3.75-0.79 5.93l-0.7901 0.4-5.53 2.77-0.8899 0.4399c-0.06 0.03-0.1199 0.07-0.1799 0.11-3.27 1.95-5.01 5.53009-5.21 10.7301l-7.9402 3.97c0.66-0.53 0.9002-1.55 0.7002-3.05-0.12-0.63-0.1801-1.29001-0.1801-1.96001l0-2.1801c0-7.35 2.02-12.56 6.08-15.62999 0.47-0.37 0.97-0.7 1.5-1 3.82-2.17 8.23-2.3499 13.23-0.5299z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />            </svg>            <svg viewBox="-1e-6 -3.6e-6 84.3299 71.94" preserveAspectRatio="none" style={{ boxSizing: "border-box", height: 18.565, left: 4.343, overflow: "visible", position: "absolute", top: 0.55, width: 21.763, zIndex: 8 }}>              <path d="M84.32988 45.76002l0 14.4401c0 1.27-0.4599 1.9899-1.3899 2.1699l-7.51 3.76-11.6402 5.81c0.36-0.37 0.5401-0.9499 0.5401-1.7399l0-14.4401c0-0.98-0.12991-1.99-0.3899-3.01-0.15-0.59-0.34009-1.1899-0.5801-1.7899-0.49-1.24-1.1199-2.4201-1.8999-3.5401-0.26-0.38-0.5401-0.75-0.8301-1.11l-6.5-8.04-19.3899-24c-0.56-0.68-1.15-1.3-1.76-1.86-0.62-0.57-1.2702-1.0499-1.9402-1.4399-0.68-0.4-1.3099-0.6501-1.8999-0.7801-0.59-0.13-1.19-0.19-1.8-0.19l-9.5999 0.79-16.30003 1.34c-0.39 0.03-0.75008 0.11-1.08008 0.24l-0.03003 0c-0.11 0.05-0.21984 0.1-0.32984 0.16l19.76998-9.87999c0.48-0.29 1.04-0.47002 1.67-0.52002l25.8999-2.13001c0.61 0 1.21 0.06007 1.8 0.19007 0.59 0.13 1.2199 0.38003 1.8999 0.78003 0.67 0.39 1.3202 0.86994 1.9402 1.43994 0.61 0.56 1.2 1.17998 1.76 1.85998l25.8899 32.04c1.17 1.45 2.08 3.0001 2.73001 4.6501 0.65 1.65 0.96999 3.2499 0.96999 4.7999z" fill="#5b5bff" />              <path d="M84.32988 45.76002l0 14.4401c0 1.27-0.4599 1.9899-1.3899 2.1699l-7.51 3.76-11.6402 5.81c0.36-0.37 0.5401-0.9499 0.5401-1.7399l0-14.4401c0-0.98-0.12991-1.99-0.3899-3.01-0.15-0.59-0.34009-1.1899-0.5801-1.7899-0.49-1.24-1.1199-2.4201-1.8999-3.5401-0.26-0.38-0.5401-0.75-0.8301-1.11l-6.5-8.04-19.3899-24c-0.56-0.68-1.15-1.3-1.76-1.86-0.62-0.57-1.2702-1.0499-1.9402-1.4399-0.68-0.4-1.3099-0.6501-1.8999-0.7801-0.59-0.13-1.19-0.19-1.8-0.19l-9.5999 0.79-16.30003 1.34c-0.39 0.03-0.75008 0.11-1.08008 0.24l-0.03003 0c-0.11 0.05-0.21984 0.1-0.32984 0.16l19.76998-9.87999c0.48-0.29 1.04-0.47002 1.67-0.52002l25.8999-2.13001c0.61 0 1.21 0.06007 1.8 0.19007 0.59 0.13 1.2199 0.38003 1.8999 0.78003 0.67 0.39 1.3202 0.86994 1.9402 1.43994 0.61 0.56 1.2 1.17998 1.76 1.85998l25.8899 32.04c1.17 1.45 2.08 3.0001 2.73001 4.6501 0.65 1.65 0.96999 3.2499 0.96999 4.7999z" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />            </svg>          </div>          <span            className={`text-sm font-medium tracking-[-0.05em] ${activeTheme === "Dark" ? "text-[#f7f7f7]" : "text-[#696969]"}`}            style={{ fontFamily: "Geist, var(--font-geist-sans)", fontWeight: 500 }}          >            No requests yet          </span>          <span            className={`text-xs tracking-[-0.04em] ${activeTheme === "Dark" ? "text-[#adadad]" : "text-[#939393]"}`}            style={{ fontFamily: "Geist, var(--font-geist-sans)" }}          >            Your log fills in as you explore          </span>        </div>      </div>        ) : (          <div className="flex flex-col" style={{ padding: "8px 8px", gap: 16 }}>            {history.slice(0, 50).map((item, i) => (              <div key={i} style={{ borderRadius: 6, padding: "6px 8px", cursor: "pointer", backgroundColor: activeTheme === "Dark" ? (i === activeHistoryIndex ? "#0f0f0f" : "#161616") : (i === activeHistoryIndex ? "#ffffff" : "transparent") }} onClick={() => onSelect(item, i)}>                <div className="flex items-center" style={{ gap: 6 }}>                  <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 6, backgroundColor: activeTheme === "Dark" ? (methodBadgeColors[item.method] ?? methodBadgeColors.GET).darkBg : (methodBadgeColors[item.method] ?? methodBadgeColors.GET).lightBg, padding: "2px 6px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, color: activeTheme === "Dark" ? (methodBadgeColors[item.method] ?? methodBadgeColors.GET).darkText : (methodBadgeColors[item.method] ?? methodBadgeColors.GET).lightText }}>{item.method}</span>                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, color: activeTheme === "Dark" ? "#f7f7f7" : "#585858", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.url}</span>                </div>              </div>            ))}          </div>        )}      </div>      <div className="shrink-0 px-3 pb-3">        <ThemeToggle activeTheme={activeTheme} onThemeChange={onThemeChange} />      </div>    </div>  );
}function ThemeToggle({  activeTheme,  onThemeChange,}: {  activeTheme: string;
  onThemeChange: (t: string) => void;
}) {  const isLight = activeTheme === "Light";
  return (    <motion.div      animate={{ backgroundColor: activeTheme === "Dark" ? "#262626" : "#f2f2f2" }}      transition={{ duration: 0.2, ease: "easeInOut" }}      className="flex w-[140px] items-center gap-2 rounded-xl p-1"    >      <motion.button        onClick={() => onThemeChange("Light")}        className="flex items-center gap-1"        animate={{ backgroundColor: isLight ? "#fff" : "#262626" }}        transition={{ duration: 0.2, ease: "easeInOut" }}        style={{ borderRadius: 8, padding: "4px 6px" }}      >        <div style={{ height: 16, overflow: "hidden", position: "relative", width: 16 }}>          <svg viewBox="0 0 8 8" preserveAspectRatio="none" style={{ height: 5.333, left: 5.333, overflow: "visible", position: "absolute", top: 5.333, width: 5.333 }}>            <path d="M8 4c0 2.20914-1.79086 4-4 4-2.20914 0-4-1.79086-4-4 0-2.20914 1.79086-4 4-4 2.20914 0 4 1.79086 4 4z" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>          <svg viewBox="0 0 1 2" preserveAspectRatio="none" style={{ height: 1.4, left: 8, overflow: "visible", position: "absolute", top: 1.333, width: 1.4 }}>            <path d="M0 0l0 2" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>          <svg viewBox="0 0 1 2" preserveAspectRatio="none" style={{ height: 1.4, left: 8, overflow: "visible", position: "absolute", top: 13.333, width: 1.4 }}>            <path d="M0 0l0 2" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>          <svg viewBox="0 0 1.41 1.41" preserveAspectRatio="none" style={{ height: 1.4, left: 3.287, overflow: "visible", position: "absolute", top: 3.287, width: 1.4 }}>            <path d="M0 0l1.41 1.41" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>          <svg viewBox="0 0 1.41 1.41" preserveAspectRatio="none" style={{ height: 1.4, left: 11.773, overflow: "visible", position: "absolute", top: 11.773, width: 1.4 }}>            <path d="M0 0l1.41 1.41" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>          <svg viewBox="0 0 2 1" preserveAspectRatio="none" style={{ height: 1.4, left: 1.333, overflow: "visible", position: "absolute", top: 8, width: 1.4 }}>            <path d="M0 0l2 0" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>          <svg viewBox="0 0 2 1" preserveAspectRatio="none" style={{ height: 1.4, left: 13.333, overflow: "visible", position: "absolute", top: 8, width: 1.4 }}>            <path d="M0 0l2 0" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>          <svg viewBox="0 0 1.41 1.41" preserveAspectRatio="none" style={{ height: 1.4, left: 3.287, overflow: "visible", position: "absolute", top: 11.773, width: 1.4 }}>            <path d="M1.41 0l-1.41 1.41" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>          <svg viewBox="0 0 1.41 1.41" preserveAspectRatio="none" style={{ height: 1.4, left: 11.773, overflow: "visible", position: "absolute", top: 3.287, width: 1.4 }}>            <path d="M1.41 0l-1.41 1.41" fill="none" stroke={isLight ? "#222" : "#818181"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>        </div>        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.6px", color: isLight ? "#222" : "#818181", transition: "color 0.2s ease" }}>          Light        </span>      </motion.button>      <motion.button        onClick={() => onThemeChange("Dark")}        className="flex items-center"        animate={{ backgroundColor: isLight ? "rgba(0,0,0,0)" : "#151515" }}        transition={{ duration: 0.2, ease: "easeInOut" }}        style={{ borderRadius: 8, padding: "6px", gap: 4 }}      >        <div style={{ height: 16, overflow: "hidden", position: "relative", width: 16 }}>          <svg viewBox="-1.4e-6 4.4e-6 17.988 17.988" preserveAspectRatio="none" style={{ height: 11.992, left: 1.999, overflow: "visible", position: "absolute", top: 2.009, width: 11.992 }}>            <path d="M17.98692 9.47273c-0.09372 1.73615-0.68832 3.40798-1.71193 4.8134-1.0236 1.40543-2.43239 2.48427-4.05605 3.10613-1.62366 0.62185-3.3927 0.76009-5.09325 0.398-1.70055-0.36209-3.25982-1.20901-4.48931-2.43837-1.22949-1.22936-2.07657-2.78854-2.43885-4.48906-0.36227-1.70051-0.22422-3.46956 0.39746-5.09329 0.62168-1.62373 1.70038-3.03263 3.1057-4.05638 1.40532-1.02375 3.07709-1.61853 4.81323-1.71243 0.405-0.022 0.617 0.46 0.402 0.803-0.71911 1.15055-1.02703 2.51087-0.87351 3.85895 0.15352 1.34808 0.75943 2.60433 1.71883 3.56373 0.9594 0.9594 2.21565 1.5653 3.56373 1.71882 1.34808 0.15352 2.7084-0.15439 3.85895-0.8735 0.344-0.215 0.825-0.004 0.803 0.401z" fill="none" stroke={isLight ? "#818181" : "#f7f7f7"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.2s ease" }} />          </svg>        </div>        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isLight ? "#818181" : "#f7f7f7", transition: "color 0.2s ease" }}>          Dark        </span>      </motion.button>    </motion.div>  );
}const demoRequests: Record<string, { method: string;
 url: string;
 body?: string }> = {  "Test a GET": {    method: "GET",    url: "https://jsonplaceholder.typicode.com/users/1",  },  "Test a POST": {    method: "POST",    url: "https://jsonplaceholder.typicode.com/posts",    body: JSON.stringify(      {        title: "Testing API Playground",        body: "This is a sample post request.",        userId: 1,      },      null,      2    ),  },  "Simulate an error": {    method: "GET",    url: "https://httpstat.us/404",  },};
const methodBadgeColors: Record<string, { lightBg: string;
 lightText: string;
 darkBg: string;
 darkText: string }> = {  GET: { lightBg: "#caffca", lightText: "#008000", darkBg: "#003b00", darkText: "#7ef97e" },  POST: { lightBg: "#fff0dd", lightText: "#ff8c00", darkBg: "#603500", darkText: "#ffc47d" },  PUT: { lightBg: "#e2e2ff", lightText: "#6565ff", darkBg: "#00006a", darkText: "#c7c7ff" },  PATCH: { lightBg: "#ffd5ff", lightText: "#ff25ff", darkBg: "#930093", darkText: "#ffb8ff" },  DELETE: { lightBg: "#ffdddd", lightText: "#ff4e4e", darkBg: "#7d0000", darkText: "#ffa4a4" },};
const methodDots: Record<string, string> = { GET: "#008000", POST: "#ff8c00", PUT: "#6565ff", PATCH: "#ff25ff", DELETE: "#ff4e4e" };
function MainContent({  activeTheme,  method,  setMethod,  url,  setUrl,  headerKey,  setHeaderKey,  headerBearer,  setHeaderBearer,  headerValue,  setHeaderValue,  response,  loading,  onSend,  responseKey,  headersFilter,  setHeadersFilter,  history,  activeHistoryIndex,  onHistorySelect,
  compact,
  w1440,
}: {  activeTheme: string;
  compact: boolean;
  w1440: boolean;
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
  onSend: (opts?: { method?: string;
 url?: string;
 headers?: Record<string, string> }) => void;
  responseKey: number;
  headersFilter: string;
  setHeadersFilter: (v: string) => void;
  history: any[];
  activeHistoryIndex: number | null;
  onHistorySelect: (item: any, index: number) => void;
}) {  const isDark = activeTheme === "Dark";
  const [showHistory, setShowHistory] = useState(false);
  const [showBrowseApi, setShowBrowseApi] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const todayKey = new Date().toDateString();
  const isTodayItem = (t: number) => new Date(t).toDateString() === todayKey;
  const recentHistory = history.slice(0, 50);
  const hasOlderHistory = recentHistory.some((item) => !isTodayItem(item.timestamp));
  const todayRows = recentHistory.filter((item) => isTodayItem(item.timestamp)).length;
  const olderRows = recentHistory.length - todayRows;
  const modalHeight =    history.length === 0      ? 413      : Math.min(413, 67 + 16 + (todayRows ? 12 + todayRows * 38 + (todayRows - 1) * 12 : 0) + (hasOlderHistory ? 16 + 12 + olderRows * 38 + (olderRows - 1) * 12 : 0) + 16);
  const renderHistoryRow = (item: any, i: number) => (    <div key={i} className="flex items-center" style={{ gap: 8, borderRadius: 6, padding: "10px 16px", cursor: "pointer", backgroundColor: isDark ? (hoveredRow === i ? "#1f1f1f" : "#0f0f0f") : (hoveredRow === i ? "#f7f7f7" : "#ffffff") }} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} onClick={() => { setShowHistory(false);
 onHistorySelect(item, i);
 }}>      <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: methodDots[item.method] ?? "#008000", flexShrink: 0 }} />      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.7px", color: isDark ? (hoveredRow === i ? "#f7f7f7" : "#adadad") : "#636363", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.url}</span>    </div>  );
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissedCheatSheet, setDismissedCheatSheet] = useState(false);
  const [expandedHeaders, setExpandedHeaders] = useState<Record<string, boolean>>({});
  const [headersCollapsed, setHeadersCollapsed] = useState(false);
  const resultContentRef = useRef<HTMLDivElement>(null);
  const [resultHeight, setResultHeight] = useState<number | "auto">("auto");
  useEffect(() => {    if (headerExpanded && !dismissedCheatSheet) setShowCheatSheet(true);
    if (!headerExpanded) setShowCheatSheet(false);
  }, [headerExpanded, dismissedCheatSheet]);
  useLayoutEffect(() => {    if (resultContentRef.current) {      setResultHeight(resultContentRef.current.scrollHeight);
    }  }, [headersFilter, response, headersCollapsed]);
  return (    <div      className="flex flex-1 flex-col"      style={{        marginLeft: compact ? 16 : 32,
        marginRight: compact ? 16 : 32,
        marginTop: compact ? 16 : 32,
        marginBottom: compact ? 16 : 32,        backgroundColor: isDark ? "#1b1b1b" : "#f5f5f5",        border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2",        borderRadius: 14,        position: "relative",        overflow: "hidden",      }}    >      <div className={`flex flex-1 flex-col ${showBrowseApi ? "w-full" : "items-center"}`} style={{ flexShrink: 0, minHeight: 0 }}>        {!response && !loading && (          <div className="flex flex-1 flex-col" style={{ maxWidth: showBrowseApi ? undefined : compact ? 425 : 574, width: showBrowseApi ? "100%" : undefined, flex: showBrowseApi ? 1 : undefined, minHeight: 0 }}>          <motion.div            className={`flex-1 overflow-y-auto flex flex-col ${showBrowseApi ? "items-stretch" : "items-center justify-center"}`}            style={{ minHeight: 0, padding: showBrowseApi ? 16 : undefined }}            variants={{              hidden: { opacity: 1 },              visible: { opacity: 1 },            }}            initial="hidden"            animate="visible"          >          {!response && !loading && showBrowseApi && (<BrowseApiSection compact={compact} w1440={w1440} isDark={isDark} onBack={() => setShowBrowseApi(false)} />)}          {!response && !loading && !showBrowseApi && (<>           <motion.div            className="relative shrink-0"            initial={false}            animate={{ height: headerExpanded ? 340 : compact ? 191 : 193 }}            transition={headersPanelTransition}            style={{
              width: compact ? 425 : 574,
              backgroundColor: isDark ? "#161616" : "#fcfcfc",
              ...(isDark ? {} : { border: "0.8px solid #f2f2f2" }),
              borderRadius: 10,
            }}          >            <motion.div initial="hidden" animate="visible" variants={cardContentVariants}>            <motion.div variants={cardItemVariants}>              <h1                className="absolute"                style={{                  left: compact ? 141 : 192,
                  top: 32,
                  fontFamily: "Geist, var(--font-geist-sans)",
                  fontSize: compact ? 18 : 24,
                  fontWeight: 500,
                  letterSpacing: compact ? "-0.9px" : "-1.2px",                  color: isDark ? "#ffffff" : "#222",                }}              >                Welcome, Explorer              </h1>            </motion.div>            <motion.div variants={cardItemVariants}>              <div className="absolute" style={{ left: compact ? 16 : 54, top: compact ? 73 : 75, width: compact ? 393 : 467, height: 52 }}>                <UrlInputBar compact={compact} activeTheme={activeTheme} method={method} setMethod={setMethod} url={url} setUrl={setUrl} loading={loading} onSend={onSend} />              </div>            </motion.div>            {!headerExpanded && (              <motion.div                variants={cardItemVariants}                className="absolute flex items-center"                style={{ left: compact ? 148 : 222, top: compact ? 141 : 143, gap: 16, cursor: "pointer" }}                onClick={() => setHeaderExpanded(true)}              >                <div className="flex items-center" style={{ gap: 4 }}>          <svg width="16" height="16" viewBox="0 0 25 25" fill="none">            <path fillRule="evenodd" clipRule="evenodd" d="M12.0369 8.71262C12.4511 8.71262 12.7869 9.0484 12.7869 9.46262V16.611C12.7869 17.0253 12.4511 17.361 12.0369 17.361C11.6227 17.361 11.2869 17.0253 11.2869 16.611V9.46262C11.2869 9.0484 11.6227 8.71262 12.0369 8.71262Z" fill="#5B5BFF" />            <path fillRule="evenodd" clipRule="evenodd" d="M7.70886 13.0368C7.70886 12.6226 8.04465 12.2868 8.45886 12.2868H15.6147C16.0289 12.2868 16.3647 12.6226 16.3647 13.0368C16.3647 13.451 16.0289 13.7868 15.6147 13.7868H8.45886C8.04465 13.7868 7.70886 13.451 7.70886 13.0368Z" fill="#5B5BFF" />            <path fillRule="evenodd" clipRule="evenodd" d="M4.96051 5.96045C3.66147 7.25949 3.05005 9.42738 3.05005 13.0368C3.05005 16.6463 3.66147 18.8142 4.96051 20.1132C6.25956 21.4123 8.42744 22.0237 12.0369 22.0237C15.6463 22.0237 17.8142 21.4123 19.1133 20.1132C20.4123 18.8142 21.0237 16.6463 21.0237 13.0368C21.0237 9.42738 20.4123 7.25949 19.1133 5.96045C17.8142 4.6614 15.6463 4.04999 12.0369 4.04999C8.42744 4.04999 6.25956 4.6614 4.96051 5.96045ZM3.89985 4.89979C5.6437 3.15594 8.34424 2.54999 12.0369 2.54999C15.7295 2.54999 18.4301 3.15594 20.1739 4.89979C21.9178 6.64364 22.5237 9.34418 22.5237 13.0368C22.5237 16.7295 21.9178 19.43 20.1739 21.1739C18.4301 22.9177 15.7295 23.5237 12.0369 23.5237C8.34424 23.5237 5.6437 22.9177 3.89985 21.1739C2.156 19.43 1.55005 16.7295 1.55005 13.0368C1.55005 9.34418 2.156 6.64364 3.89985 4.89979Z" fill="#5B5BFF" />          </svg>                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.56px", color: "#5b5bff" }}>                    Header                  </span>                </div>                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.56px", color: "#9e9e9e" }}>                  Optional                </span>              </motion.div>            )}            </motion.div>            <AnimatePresence>              {headerExpanded && (<>                <motion.div                  key="headers-panel"                  className="absolute"                  style={{                    left: compact ? 16 : 54,
                    top: 143,
                    width: compact ? 393 : 467,
                    overflow: "hidden",                  }}                  initial={{ height: 0, opacity: 0 }}                  animate={{ height: "auto", opacity: 1 }}                  exit={{ height: 0, opacity: 0 }}                  transition={headersPanelTransition}                >                  <div                    style={{                      borderRadius: 6,                      backgroundColor: isDark ? "#0f0f0f" : "#fcfcfc",                      border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2",                    }}                  >                    <div className="flex items-center" style={{ height: 44, paddingLeft: 16, paddingRight: 16 }}>                      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858" }}>                        Headers                      </span>                      <div style={{ position: "relative", display: "inline-flex" }}>                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 8, cursor: "pointer" }} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>                          <circle cx="8" cy="8" r="6.667" stroke="#9e9e9e" strokeWidth="1.4" />                          <path d="M8 5.333v2.667" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />                          <circle cx="8" cy="11" r="0.5" fill="#9e9e9e" />                        </svg>                        <AnimatePresence>                          {showTooltip && (                            <motion.div                              initial={{ opacity: 0, scale: 0.96 }}                              animate={{ opacity: 1, scale: 1 }}                              exit={{ opacity: 0, scale: 0.96 }}                              transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}                              style={{                                position: "absolute",                                left: -2,                                top: 20,                                width: 220,                                backgroundColor: isDark ? "#0f0f0f" : "#fff",                                borderRadius: 6,                                boxShadow: isDark ? "0 12px 14px rgba(61,61,61,0.5)" : "0 12px 14px rgba(219,219,219,0.5)",                                zIndex: 60,                                padding: "12px 12px",                              }}                            >                              <div style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: isDark ? "#f7f7f7" : "#616161" }}>Authorization: Bearer sk-abc123</div>                              <div style={{ marginTop: 12, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#adadad" : "#9e9e9e" }}>Proves who you are ( Authorization ), using a token-based method ( Bearer ), with your secret key (sk-abc123)</div>                            </motion.div>              )}            </AnimatePresence>                      </div>                      <div className="ml-auto flex items-center" style={{ gap: 4 }}>                        <div style={{ width: 15, height: 16 }}>                          <svg width="15" height="16" viewBox="0 0 15 16">                            <g transform="translate(0.969, 1.952) scale(0.729, 0.747)">                              <path transform="translate(-1.5, -1.5)" d="M3.41046 3.41046c-1.29904 1.29904-1.91046 3.46693-1.91046 7.07635 0 3.6095 0.61142 5.7774 1.91046 7.0764 1.29905 1.2991 3.46693 1.9105 7.07639 1.9105 3.6094 0 5.7773-0.6114 7.0764-1.9105 1.299-1.299 1.9104-3.4669 1.9104-7.0764 0-3.60942-0.6114-5.77731-1.9104-7.07635-1.2991-1.29905-3.467-1.91046-7.0764-1.91046-3.60946 0-5.77734 0.61141-7.07639 1.91046z m-1.06066-1.06066c1.74385-1.74385 4.44439-2.3498 8.13705-2.3498 3.6926 0 6.3932 0.60595 8.137 2.3498 1.7439 1.74385 2.3498 4.44439 2.3498 8.13701 0 3.6927-0.6059 6.3932-2.3498 8.1371-1.7438 1.7438-4.4444 2.3498-8.137 2.3498-3.69266 0-6.3932-0.606-8.13705-2.3498-1.74385-1.7439-2.3498-4.4444-2.3498-8.1371 0-3.69262 0.60595-6.39316 2.3498-8.13701z" fill="#5b5bff" fillRule="evenodd" />                            </g>                            <g transform="translate(7.054, 5.896) scale(0.625, 0.64)">                              <path d="M0.75 0c0.4142 0 0.75 0.33578 0.75 0.75l0 7.14838c0 0.4143-0.3358 0.75-0.75 0.75-0.4142 0-0.75-0.3357-0.75-0.75l0-7.14838c0-0.41422 0.3358-0.75 0.75-0.75z" fill="#5b5bff" fillRule="evenodd" />                            </g>                            <g transform="translate(4.818, 8.184) scale(0.625, 0.64)">                              <path d="M0 0.75c0-0.4142 0.33579-0.75 0.75-0.75l7.15584 0c0.4142 0 0.75 0.3358 0.75 0.75 0 0.4142-0.3358 0.75-0.75 0.75l-7.15584 0c-0.41421 0-0.75-0.3358-0.75-0.75z" fill="#5b5bff" fillRule="evenodd" />                            </g>                          </svg>                        </div>                        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: "#5b5bff" }}>                          Add header                        </span>                        <div style={{ display: "flex", alignItems: "center", borderRadius: 6, backgroundColor: isDark ? "#1c1c1c" : "#e8e8e8", padding: "2px 4px" }}>                          <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#d1d1d1" : "#4d4d4d", textAlign: "center" }}>                            Coming soon                          </span>                        </div>                      </div>                    </div>                    <div className="flex" style={{ gap: 16, padding: "0 12px 12px" }}>                      <div className="flex flex-col" style={{ gap: 16, width: 203 }}>                        <div style={{ borderRadius: 8, backgroundColor: isDark ? "#0c0c0c" : "#fafafa", border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", padding: "12px 123px 12px 12px", height: 40, display: "flex", alignItems: "center" }}>                          <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#8c8c8c" : "#5b5b5b" }}>                            Authorization                          </span>                        </div>                        <div style={{ borderRadius: 8, backgroundColor: isDark ? "#212121" : "#fff", border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", padding: "12px 171px 12px 12px", minHeight: 40, position: "relative" }}>                          <input type="text" placeholder="Key" value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} className="placeholder:text-[#6e6d6d]" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: "0 12px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#c7c7c7" : "#6e6d6d", border: "none", outline: "none", background: "transparent", overflow: "hidden" }} />                        </div>                      </div>                      <div className="flex flex-col" style={{ gap: 16, width: 216 }}>                        <div style={{ borderRadius: 8, backgroundColor: isDark ? "#212121" : "#fff", border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", padding: "12px 123px 12px 12px", minHeight: 40, position: "relative" }}>                          <input type="text" placeholder="Bearer SK-____" value={headerBearer} onChange={(e) => setHeaderBearer(e.target.value)} className="placeholder:text-[#6e6d6d]" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: "0 12px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#c7c7c7" : "#6e6d6d", border: "none", outline: "none", background: "transparent", whiteSpace: "nowrap", overflow: "hidden" }} />                        </div>                        <div style={{ borderRadius: 8, backgroundColor: isDark ? "#212121" : "#fff", border: isDark ? "1px solid #312f2f" : "1px solid #f2f2f2", padding: "12px 175px 12px 12px", minHeight: 40, position: "relative" }}>                          <input type="text" placeholder="Value" value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} className="placeholder:text-[#6e6d6d]" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: "0 12px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#c7c7c7" : "#6e6d6d", border: "none", outline: "none", background: "transparent", overflow: "hidden" }} />                        </div>                      </div>                    </div>                  </div>                </motion.div>                <motion.div                  key="cancel-button"                  initial={{ opacity: 0 }}                  animate={{ opacity: 1 }}                  exit={{ opacity: 0 }}                  transition={{ delay: 0.05, duration: 0.15 }}                >                  <div                    className="absolute cursor-pointer"                    style={{ right: 45, top: 137 }}                    onClick={() => setHeaderExpanded(false)}                  >                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">                      <circle cx="9" cy="9" r="7.5" stroke="#9e9e9e" strokeWidth="1.4" />                      <path d="M6 6l6 6M12 6l-6 6" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />                    </svg>                  </div>                </motion.div>              </>)}            </AnimatePresence>          </motion.div>          <motion.div variants={cardItemVariants} className="mt-6 flex items-center" style={{ gap: 16 }}>            {["Test a GET", "Test a POST", "Simulate an error", "View history"].map((label) => (              <button                key={label}                onClick={() => {                  const demo = demoRequests[label];
                  if (demo) {                    setMethod(demo.method);
                    setUrl(demo.url);
                    onSend({ method: demo.method, url: demo.url });
                  } else if (label === "View history") {                    setShowHistory((v) => !v);
                  }                }}                className={`flex items-center justify-center px-2 py-1.5 text-xs font-medium tracking-[-0.04em] ${isDark ? "" : "bg-white text-[#5a5a5a] hover:bg-gray-50"}`}                style={{                  borderRadius: 6,                  boxShadow: isDark ? "inset 0 0 0 0.8px #202020" : "inset 0 0 0 0.8px #f2f2f2",                  fontFamily: "Geist, var(--font-geist-sans)",                  fontWeight: 500,                  ...(isDark ? { backgroundColor: "#0f0f0f", color: "#8c8c8c" } : {}),                }}              >                {label}              </button>            ))}          </motion.div>
          </>)}          </motion.div>        </div>      )}      <AnimatePresence>        {showHistory && (          <motion.div            key="history-glass"            className="fixed inset-0"            style={{              zIndex: 50,              pointerEvents: "auto",              backdropFilter: "blur(36.75px)",              WebkitBackdropFilter: "blur(36.75px)",              background:                isDark                  ? "linear-gradient(-23.5deg, rgba(36, 36, 36, 0.47), rgba(129, 129, 129, 0))"                  : "linear-gradient(-23.5deg, rgba(180, 180, 180, 0.47), rgba(230, 230, 230, 0))",            }}            initial={{ opacity: 0 }}            animate={{ opacity: 0.75 }}            exit={{ opacity: 0 }}            transition={{ duration: 0.18, ease: "easeOut" }}          />        )}      </AnimatePresence>      <AnimatePresence>        {showHistory && (          <motion.div            key="history-panel"            className="fixed"            style={{              left: "calc(50% - 286.5px)",              top: `calc(50% - ${modalHeight / 2}px)`,              zIndex: 60,              width: 573,              height: modalHeight,              backgroundColor: isDark ? "#0f0f0f" : "#ffffff",              ...(isDark ? {} : { border: "0.8px solid #f2f2f2" }),              borderRadius: 10,            }}            initial="hidden"            animate="visible"            exit={{ opacity: 0, scale: 0.97 }}            variants={cardContentVariants}          >            <motion.div variants={cardItemVariants}>              <div className="absolute flex items-center" style={{ left: 16, top: 16, gap: 8 }}>                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">                  <circle cx="8.825" cy="8.825" r="6.741" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                  <path d="M13.514 13.864l2.643 2.636" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                </svg>                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, letterSpacing: "-0.8px", color: "#999999" }}>Search....</span>              </div>              <svg className="absolute" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ right: 16, top: 17, cursor: "pointer" }} onClick={() => setShowHistory(false)}>                <circle cx="9" cy="9" r="7.5" stroke="#9e9e9e" strokeWidth="1.4" />                <path d="M6 6l6 6M12 6l-6 6" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" />              </svg>              <div className="absolute" style={{ left: 16, top: 51, right: 16, height: 0.8, backgroundColor: isDark ? "#2d2d2d" : "#f2f2f2" }} />            </motion.div>            <motion.div variants={cardItemVariants}>              <div className="hide-scrollbar" style={{ position: "absolute", left: 16, top: 67, right: 16, bottom: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>                {history.length === 0 ? (                  <div className="flex flex-col items-center" style={{ gap: 12, paddingTop: 66 }}>                    <img src="/history-empty.png" alt="" style={{ width: 70, height: 70 }} />                    <div className="flex flex-col items-center" style={{ gap: 8 }}>                      <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.7px", color: isDark ? "#f7f7f7" : "#696969" }}>No requests yet</span>                      <span style={{ width: 280, textAlign: "center", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.56px", lineHeight: "20px", color: isDark ? "#adadad" : "#939393" }}>Try one of the demo buttons above, or send your first request.</span>                    </div>                  </div>                ) : (                  <>                    <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858" }}>Today</span>                    {recentHistory.map((item, i) => (isTodayItem(item.timestamp) ? renderHistoryRow(item, i) : null))}                    {hasOlderHistory && (                      <>                        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858" }}>Previous 30 days</span>                        {recentHistory.map((item, i) => (!isTodayItem(item.timestamp) ? renderHistoryRow(item, i) : null))}                      </>                    )}                  </>                )}              </div>            </motion.div>          </motion.div>              )}            </AnimatePresence>          {(loading || response) && (          <>          <div className="hide-scrollbar" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 76, overflowY: "scroll", overflowX: "hidden", paddingBottom: 100 }}>            <div className="flex items-center" style={{ marginRight: 24, marginTop: 24, marginLeft: "auto", width: "fit-content", maxWidth: "calc(100% - 48px)", minHeight: 50, borderRadius: 10, backgroundColor: isDark ? "#0f0f0f" : "#fcfcfc", gap: 4, padding: "0 16px", boxSizing: "border-box" }}>                <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: isDark ? "#00bf00" : "#008000" }} />                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: isDark ? "#ffffff" : "#5a5a5a" }}>{method}</span>                <span style={{ display: "block", maxWidth: 520, whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: isDark ? "#d1d1d1" : "#767676" }}>{url || "/v1/nodes/status"}</span>              </div>            <div className="flex items-center" style={{ marginRight: 24, marginTop: 12, marginLeft: "auto", gap: 8, cursor: "pointer", width: "fit-content" }}>              <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0, overflow: "hidden" }}>                <div style={{ position: "absolute", left: 2, top: 2, width: 12, height: 11.629 }}>                  <div style={{ position: "absolute", left: 0, top: 0, width: 12, height: 11.629 }}>                    <svg viewBox="0 0 7.2526 1" preserveAspectRatio="none" style={{ position: "absolute", left: 7.165, top: 11.629, width: 4.835, height: 1.4, overflow: "visible" }}>                      <path d="M0 0l7.2526 0" fill="none" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />                    </svg>                    <svg viewBox="-0.0000015757977962493896 -0.000005125999450683594 15.679938938468695 17.44302499294281" preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0, width: 10.453, height: 11.629, overflow: "visible" }}>                      <path d="M9.78001 0.79479c0.77564-0.92701 2.16998-1.06294 3.11622-0.30306 0.05232 0.04123 1.73325 1.34706 1.73325 1.34706 1.0395 0.6284 1.36249 1.96432 0.71991 2.9838-0.03412 0.0546-9.53745 11.94189-9.53744 11.94189-0.31617 0.39442-0.79611 0.62729-1.30904 0.63286l-3.63938 0.04568-0.82-3.47071c-0.11487-0.48802 0-1.00054 0.31617-1.39496l9.42031-11.78256z" fill="none" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />                    </svg>                    <svg viewBox="0 0 5.45224 4.18713" preserveAspectRatio="none" style={{ position: "absolute", left: 5.347, top: 2.001, width: 3.635, height: 2.791, overflow: "visible" }}>                      <path d="M0 0l5.45224 4.18713" fill="none" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />                    </svg>                  </div>                </div>              </div>              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 400, color: "#9e9e9e", letterSpacing: "-0.7px", whiteSpace: "nowrap" }}>Edit</span>            </div>            <motion.div              animate={{ height: resultHeight }}              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}              style={{ marginLeft: 24, marginTop: 14, maxWidth: 787, borderRadius: 10, backgroundColor: isDark ? "#0f0f0f" : "#fcfcfc", overflowWrap: "break-word", wordBreak: "break-word", overflow: "hidden" }}>              <div ref={resultContentRef}>              {!response ? (                <div style={{ padding: 16 }}>                  <LoadingState label="Sending" variant="Drive" dark={isDark} />                </div>              ) : (                <>                <motion.div                className="flex items-center"                initial={{ opacity: 0, y: 6 }}                animate={{ opacity: 1, y: 0 }}                transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.1 }}                style={{ padding: "16px", gap: 12 }}              >                {response.error ? (                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, color: "#dc143c" }}>Error</span>                ) : (                  <>                    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 6, backgroundColor: "#caffca", padding: "4px 8px", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: response.status >= 200 && response.status < 300 ? "#008000" : "#dc143c" }}>{response.status}</span>                    <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: isDark ? "#9e9e9e" : "#585858" }}>{response.time}ms</span>                    <div className="flex items-center" style={{ marginLeft: "auto" }}>                      <div onClick={() => setHeadersFilter("common")} style={{ width: 53, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>                        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", color: headersFilter === "common" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>Common</span>                        <div style={{ width: "100%", height: 0, borderTop: headersFilter === "common" ? (isDark ? "1px solid #ffffff" : "1px solid #000") : (isDark ? "1px solid #1b1b1b" : "1px solid #fcfcfc") }} />                      </div>                      <div onClick={() => setHeadersFilter("all")} style={{ width: 53, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>                        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", color: headersFilter === "all" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>All</span>                        <div style={{ width: "100%", height: 0, borderTop: headersFilter === "all" ? (isDark ? "1px solid #ffffff" : "1px solid #000") : (isDark ? "1px solid #1b1b1b" : "1px solid #fcfcfc") }} />                      </div>                    </div>                  </>                )}                {response.error && <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 11, color: "#9e9e9e" }}>{response.error}</span>}              </motion.div>              <div style={{ height: 0, borderTop: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2" }} />              {!response.error && (                <motion.div                  initial="hidden"                  animate="visible"                  variants={{                    hidden: {},                    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } },                  }}                  style={{ padding: "12px" }}                >                  <div className="flex items-center" style={{ gap: 8, marginLeft: 16, cursor: "pointer" }} onClick={() => setHeadersCollapsed(!headersCollapsed)}>                    <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, color: isDark ? "#ffffff" : "#585858" }}>Response Headers</span>                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: headersCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>                      <path d="M4 6l4 4 4-4" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                    </svg>                  </div><motion.div                  initial={false}                  animate={{ height: headersCollapsed ? 0 : "auto", opacity: headersCollapsed ? 0 : 1 }}                  transition={{ duration: 0.2, ease: "easeInOut" }}                  style={{ overflow: "hidden" }}                >                  {response.headers && Object.keys(response.headers).length > 0 && (                    <>                      {(() => {                        const entries = Object.entries(response.headers).slice(0, 20);
                        const filtered = headersFilter === "common"                          ? entries.filter(([k]) => commonKeys.includes(k.toLowerCase()))                          : entries;
                        if (filtered.length === 0) {                          return null;
                        }                        return (                          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 24 }}>                            {(() => {                              function parseStructured(val: string): { key: string;
 value: string }[] | null {                                try {                                  const parsed = JSON.parse(val);
                                  if (typeof parsed === "object" && parsed !== null) {                                    return Object.entries(parsed).map(([k, v]) => ({ key: k, value: typeof v === "object" ? JSON.stringify(v) : String(v) }));
                                  }                                } catch {}                                const qIdx = val.indexOf("?");
                                if (qIdx !== -1 && qIdx < val.length - 1) {                                  try {                                    const qs = val.substring(qIdx + 1);
                                    const params = new URLSearchParams(qs);
                                    const entries: { key: string;
 value: string }[] = [];
                                    params.forEach((v, k) => entries.push({ key: k, value: v }));
                                    if (entries.length > 0) return entries;
                                  } catch {}                                }                                if (val.includes("=") && (val.includes(",") || val.includes(" "))) {                                  const parts = val.split(",").map(s => s.trim()).filter(Boolean);
                                  const entries: { key: string;
 value: string }[] = [];
                                  for (const part of parts) {                                    const eqIdx = part.indexOf("=");
                                    if (eqIdx !== -1) entries.push({ key: part.substring(0, eqIdx).trim(), value: part.substring(eqIdx + 1).trim() });
                                  }                                  if (entries.length > 0) return entries;
                                }                                return null;
                              }                              return filtered.map(([k, v]) => {                              const lk = k.toLowerCase();
                              const extraSpace = lk === "nel" ? 36 : lk === "report" || lk === "reporting-endpoint" || lk === "report-to" || lk === "reporting-endpoints" ? 24 : 0;
                              const isLong = (v as string).length > 60;
                              const isExpanded = expandedHeaders[k];
                              const parsed = lk === "report-to" && headersFilter === "all" ? parseStructured(v as string) : null;
                              const displayVal = isLong && !isExpanded ? (v as string).substring(0, 60) + "..." : v as string;
                              return (                              <motion.div                                key={k}                                variants={{                                  hidden: { opacity: 0, y: 6 },                                  visible: { opacity: 1, y: 0 },                                }}                                transition={{ type: "spring", stiffness: 400, damping: 28 }}                                style={{ display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)", columnGap: 40, alignItems: "start", marginLeft: 16 }}                              >                                <span style={{ flexShrink: 0, marginRight: 24 + extraSpace, whiteSpace: "nowrap", overflowWrap: "normal", wordBreak: "normal", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 400, color: "#9e9e9e" }}>{k}</span>                                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 400, color: isDark ? "#c7c7c7" : "#4a4a4a", wordBreak: "break-word", paddingRight: 16 }}>                                  <div style={{ textAlign: "left", maxWidth: "72%" }}>                                    {parsed && isExpanded ? (                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", alignItems: "baseline", fontSize: 14, color: "#6a6a6a" }}>                                        {parsed.map(p => (                                          <span key={p.key}>                                            <span style={{ fontWeight: 500, color: "#9e9e9e" }}>{p.key}:</span>                                            <span style={{ wordBreak: "break-word" }}> {p.value}</span>                                          </span>                                        ))}                                      </div>                                    ) : (                                      <span>{displayVal}</span>                                    )}                                  </div>                                  {isLong && headersFilter === "all" && (                                    <span onClick={() => setExpandedHeaders(p => ({ ...p, [k]: !isExpanded }))} style={{ cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>                                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">                                        <path d="M4 6l4 4 4-4" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                                      </svg>                                    </span>                                  )}                                </div>                              </motion.div>                              );
                            })})()}                          </div>                        );
                      })()}                    </>                  )}                </motion.div>                </motion.div>              )}              {!response.error && (                <motion.div                  initial={{ opacity: 0, y: 8 }}                  animate={{ opacity: 1, y: 0 }}                  transition={{ type: "spring", stiffness: 350, damping: 26, delay: 0.28 }}                  style={{ padding: "12px" }}                >                  <BodyViewer body={response.body} isDark={isDark} />                </motion.div>              )}                </>              )}              </div>            </motion.div>            <div className="flex items-center" style={{ marginLeft: 24, marginTop: 12, gap: 8, cursor: "pointer" }}>              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">                <path d="M2 8a6 6 0 0110.465-4" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                <path d="M13.333 1.333V4H11" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                <path d="M14 8a6 6 0 01-10.465 4" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />                <path d="M2.667 14.667V12H5" stroke="#9e9e9e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />              </svg>              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: "#9e9e9e" }}>Retry</span>            </div>          </div>          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10, padding: "0 0 4px", display: "flex", justifyContent: "center", background: "transparent", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderTop: "none" }}>            <UrlInputBar activeTheme={activeTheme} method={method} setMethod={setMethod} url={url} setUrl={setUrl} loading={loading} onSend={onSend} />          </div>          </>          )}
      <AnimatePresence>      {showCheatSheet && (        <motion.div          initial={{ opacity: 0, scale: 0.96 }}          animate={{ opacity: 1, scale: 1 }}          exit={{ opacity: 0, scale: 0.96 }}          transition={{ type: "spring", stiffness: 350, damping: 26, mass: 0.7 }}          style={{            position: "absolute",            right: 16,            top: 16,            width: 297,            height: 339,            backgroundColor: isDark ? "#0f0f0f" : "#fff",            borderRadius: 10,            zIndex: 50,            overflow: "hidden",          }}        >          <div style={{ position: "absolute", left: 0, top: 0, width: 297, height: 64, background: "url('/cheat sheet rectangle.png') center/cover no-repeat" }} />          <motion.div            initial={{ opacity: 0 }}            animate={{ opacity: 1 }}            transition={{ delay: 0.25 }}            style={{ position: "absolute", left: 260.84, top: 6.97, width: 24, height: 25, cursor: "pointer" }}            onClick={() => { setShowCheatSheet(false);
 setDismissedCheatSheet(true);
 }}          >            <svg width="19.5" height="19.5" viewBox="0 0 19.5 19.5" style={{ position: "absolute", left: 2.5, top: 3.28 }}>              <path fillRule="evenodd" clipRule="evenodd" d="M13.211 12.13903l-1.061 1.061-2.401-2.399-2.4 2.396-1.06-1.061 2.399-2.395-2.399-2.398 1.061-1.06103 2.4 2.39903 2.401-2.39703 1.06 1.06203-2.4 2.395 2.4 2.398z m-3.461-12.13903c-5.376 0-9.75 4.374-9.75 9.75003 0 5.376 4.374 9.75 9.75 9.75 5.376 0 9.75-4.374 9.75-9.75 0-5.37603-4.374-9.75003-9.75-9.75003z" fill="#fff" />            </svg>          </motion.div>          <span style={{ position: "absolute", left: 12, top: 76, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.8px", color: isDark ? "#f7f7f7" : "#616161" }}>cheat sheet</span>          <motion.div            variants={{ visible: { transition: { staggerChildren: 0.02, delayChildren: 0.08 } } }}            initial="hidden"            animate="visible"            style={{ position: "absolute", left: 12, top: 109, width: 273, height: 218, borderRadius: 8, border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#0f0f0f" : "#fff" }}          >            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 12, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.4px", color: isDark ? "#e4e4e4" : "#737373" }}>Headers -</motion.span>            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 67, top: 12, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>What they are, why servers care</motion.span>            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 36, width: 249, height: 1, backgroundColor: isDark ? "#312f2f" : "#f2f2f2" }} />            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 45, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.4px", color: isDark ? "#e4e4e4" : "#737373" }}>Authorization -</motion.span>            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 94, top: 45, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>The specific header that gates</motion.span>            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 65, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>access on most API</motion.span>            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 89, width: 249, height: 1, backgroundColor: isDark ? "#312f2f" : "#f2f2f2" }} />            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 97, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.4px", color: isDark ? "#e4e4e4" : "#737373" }}>Bearer Token -</motion.span>            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 92, top: 97, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>why it's just a string, no password</motion.span>            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 13, top: 117, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>flow</motion.span>            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 141, width: 249, height: 1, backgroundColor: isDark ? "#312f2f" : "#f2f2f2" }} />            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 149, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.4px", color: isDark ? "#e4e4e4" : "#737373" }}>API key/ SL prefix -</motion.span>            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 117, top: 149, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>treat-it- like a password</motion.span>            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 169, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>framing since this is a real security habit worth</motion.span>            <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", left: 12, top: 190, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.4px", color: isDark ? "#8b8b8b" : "#9e9e9e" }}>planting early</motion.span>          </motion.div>        </motion.div>              )}            </AnimatePresence>    </div>
      {!response && !loading && !showBrowseApi && (
        <motion.div
          variants={cardItemVariants}
          initial="hidden"
          animate="visible"
          style={{ position: "absolute", left: 0, right: 0, bottom: 16, display: "flex", justifyContent: "center", zIndex: 10 }}
        >
          <div
style={{
              width: compact ? 423 : 528,
              backgroundColor: isDark ? "#161616" : "#fcfcfc",
              borderRadius: 10,
              display: "flex",
              alignItems: "flex-start",
              padding: 12,
              gap: 16,
              cursor: "pointer",
              boxSizing: "border-box",
            }}
            onClick={() => setShowBrowseApi(true)}
          >
            <div
              style={{
                width: 69,
                height: 69,
                borderRadius: 8,
                background: "url('/browse-api-icon.png') center/cover no-repeat",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 600, color: "white" }}>{'{ }'}</span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.8px", color: isDark ? "#ffffff" : "#222" }}>Browse API</span>
              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, letterSpacing: "-0.56px", lineHeight: "20px", color: isDark ? "#adadad" : "#939393", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>Pick a use case, test a real API in seconds, Stripe, OpenAI, and 13 more — ready to poke at.</span>
            </div>
            <div style={{ flexShrink: 0, alignSelf: "flex-start", display: "flex", alignItems: "center", borderRadius: 6, backgroundColor: "#5a5aff", padding: "6px 12px", cursor: "pointer" }}>
              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: "white", textAlign: "center" }}>Search</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>  );
}
function BrowseApiSection({ compact, w1440, isDark, onBack }: { compact?: boolean; w1440?: boolean; isDark: boolean; onBack: () => void }) {
  const [activeFilter, setActiveFilter] = useState("Everything");
  const [hoveredApi, setHoveredApi] = useState<string | null>(null);
  const [selectedApi, setSelectedApi] = useState<(typeof apis)[number] | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showTopBlur, setShowTopBlur] = useState(false);
  const [showBottomBlur, setShowBottomBlur] = useState(false);
  const detailBig = !compact;
  const filters = ["Everything", "Payment", "Auth", "AI", "Data", "Comms", "Quick wins"];

  const apis: { name: string; desc: string; color: string; letter: string; category: string; logo?: string; logoColor?: string; keyDesc?: string; tag?: string; keyLabel?: string; cardBg?: string; panelBg?: string; panelBorder?: string; labelColor?: string; height?: number; url?: string; auth?: string }[] = [
    { name: "Stripe", desc: "Create a test payment or inspect your balance", keyDesc: "Requires a secret test key from your stripe dashboard", color: "#635BFF", letter: "S", category: "Payment", logo: "/api-logos/stripe.png", url: "https://api.stripe.com/v1/balance", auth: "Authorization: Bearer sk_test....", height: 205 },
    { name: "Paystack", desc: "initialize transactions for your next product", keyDesc: "Requires a secret test key from your Paystack dashboard", color: "#72D46B", letter: "P", category: "Payment", logo: "/api-logos/paystack.png", url: "https://api.paystack.co/transaction", auth: "Authorization: Bearer your_secret_key" },
    { name: "Clerk", desc: "Explore users, sessions, and identity data", keyDesc: "Requires a secret key from your clerk instance", color: "#6C47FF", letter: "C", category: "Auth", logo: "/api-logos/clerk.png", url: "https://api.clerk.com/v1/users", auth: "Authorization: Bearer your_secret_key" },
    { name: "WorkOS", desc: "Test directory sync and enterprise sign-in", keyDesc: "Requires an API key from your WorkOS dashboard", color: "#4A6CF7", letter: "W", category: "Auth", logo: "/api-logos/workos.png", url: "https://api.workos.com/v1/directories", auth: "Authorization: Bearer your_secret_key" },
    { name: "OpenAI", desc: "Send your first prompt to a language model", keyDesc: "Requires an API key from platform.openai.com", color: "#10A37F", letter: "O", category: "AI", logo: "/api-logos/openai.png", url: "https://api.openai.com/v1/models", auth: "Authorization: Bearer your_api_key" },
    { name: "Anthropic", desc: "check available Claude models and version", keyDesc: "Requires an API key from console.anthropic.com", color: "#D97757", letter: "A", category: "AI", logo: "/api-logos/anthropic.png", url: "https://api.anthropic.com/v1/models", auth: "Authorization: Bearer your_api_key" },
    { name: "Replicate", desc: "Browse models ready for your next experiment", keyDesc: "Requires an API key from your replicate account", color: "#FF6B6B", letter: "R", category: "AI", logo: "/api-logos/replicate.png", url: "https://api.replicate.com/v1/models", auth: "Authorization: Bearer your_api_token" },
    { name: "OpenWeather", desc: "Get the current weather for any city", keyDesc: "Requires a free API key from openweathermap.org.", color: "#F48120", letter: "W", category: "Data", logo: "/api-logos/openweather.png", url: "https://api.openweathermap.org/data/2.5/weather?q=London", auth: "Authorization: Bearer your_api_key" },
    { name: "Resend", desc: "Explore the email built for developers", keyDesc: "Requires an API key from your Resend dashboard", color: "#000000", letter: "R", category: "Comms", logo: "/api-logos/resend.png", url: "https://api.resend.com/emails", auth: "Authorization: Bearer your_api_key" },
    { name: "REST Countries", desc: "Find country flags, currencies and regions", color: "#111111", letter: "R", category: "Data", tag: "No auth", keyLabel: "Ready to send", panelBg: "#e4fee4", panelBorder: "none", labelColor: "#0d8c0d", logoColor: "#111111", cardBg: "#fcfcfc", height: 157, url: "https://restcountries.com/v3.1/all" },
    { name: "IPinfo", desc: "Look up location and network details from an IP", color: "#3285D8", letter: "IP", category: "Data", tag: "No auth", keyLabel: "Ready to send", panelBg: "#e4fee4", panelBorder: "none", labelColor: "#0d8c0d", logoColor: "#3285D8", cardBg: "#fcfcfc", height: 157, url: "https://ipinfo.io/json" },
    { name: "Open-Meteo", desc: "current weather, no key needed", color: "#3285D8", letter: "O", category: "Data", tag: "No auth", keyLabel: "Ready to send", panelBg: "#e4fee4", panelBorder: "none", labelColor: "#0d8c0d", logoColor: "#3285D8", cardBg: "#fcfcfc", height: 157, url: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41" },
  ];

  const filteredApis = activeFilter === "Everything" ? apis : activeFilter === "Quick wins" ? apis.filter(a => a.tag === "No auth") : apis.filter(a => a.category === activeFilter);

  const comingSoon = ["Auth", "AI", "Data", "Comms"];
  const nextCategories = activeFilter && comingSoon.includes(activeFilter)
    ? comingSoon.filter(c => c !== activeFilter)
    : comingSoon;
  const frameText = nextCategories.length === 1
    ? `${nextCategories[0]} category is next`
    : `${nextCategories.slice(0, -1).join(", ")}${nextCategories.length > 2 ? "," : ""} and ${nextCategories[nextCategories.length - 1]} categories are next`;
  const showMoreFrame = activeFilter !== "Everything" && activeFilter !== "Quick wins";

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) { setShowTopBlur(false); setShowBottomBlur(false); }
    else { setShowTopBlur(el.scrollTop > 2); setShowBottomBlur(el.scrollTop < max - 2); }
  }, [filteredApis]);
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) { setShowTopBlur(false); setShowBottomBlur(false); return; }
    setShowTopBlur(el.scrollTop > 2);
    setShowBottomBlur(el.scrollTop < max - 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex flex-1 flex-col"
      style={{ width: "100%", flex: 1, alignSelf: "stretch", boxSizing: "border-box", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, color: isDark ? "#ffffff" : "#222", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Playground</button>
        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, color: isDark ? "#9e9e9e" : "#939393" }}>/</span>
        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, color: "#939393" }}>Discover</span>
      </div>

      <div style={{ borderRadius: 6, backgroundColor: isDark ? "#1b1b1b" : "#ffffff", padding: "16px 16px 0", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="hide-scrollbar" style={{ display: "flex", flexDirection: "column" }}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: isDark ? "#1b1b1b" : "#ffffff", paddingBottom: 16 }}>
        <div style={{ borderRadius: 6, backgroundColor: isDark ? "#1a1a2e" : "#e4e4ff", display: "inline-flex", padding: "4px 10px", marginBottom: 16, width: "fit-content" }}>
          <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, color: "#5a5aff" }}>Curated Discovery</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <h1 style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 18, fontWeight: 500, letterSpacing: "-1px", color: isDark ? "#ffffff" : "#222222", margin: 0, marginBottom: 4 }}>what are you building?</h1>
            <p style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: isDark ? "#adadad" : "#939393", margin: 0 }}>Start with a real API, not a blank screen. Pick a use case and poke at a safe example request</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", backgroundColor: isDark ? undefined : "#ffffff", padding: "8px 12px", minWidth: 200, marginTop: 4 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8.825" cy="8.825" r="6.741" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.514 13.864l2.643 2.636" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, color: "#999999" }}>Search....</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                fontFamily: "Geist, var(--font-geist-sans)",
                fontSize: 12,
                fontWeight: 500,
                color: activeFilter === f ? (isDark ? "#ffffff" : "#656363") : (isDark ? "#9e9e9e" : "#818181"),
                backgroundColor: activeFilter === f ? "#efefef" : (isDark ? "transparent" : "#fcfcfc"),
                borderRadius: 4,
                border: "none",
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >{f}</button>
          ))}
        </div>
        </motion.div>
        </div>

        <div style={{ position: "relative", borderRadius: 6, backgroundColor: isDark ? "#1b1b1b" : "#ffffff", border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", padding: isDark ? "12px 16px" : 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div ref={scrollRef} onScroll={handleScroll} className="hide-scrollbar" style={{ position: "relative", width: "100%", flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", scrollBehavior: "smooth", overscrollBehavior: "contain" }}>
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ display: "grid", gridTemplateColumns: compact ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 16, gridAutoRows: "auto", alignItems: (compact || w1440) ? "start" : "stretch" }}
        >
        {filteredApis.map(api => (
          <div key={api.name} onMouseEnter={() => setHoveredApi(api.name)} onMouseLeave={() => setHoveredApi(null)} style={{ borderRadius: 4, backgroundColor: isDark ? "#161616" : (api.cardBg ?? (hoveredApi === api.name ? "#fcfcfc" : "#ffffff")), border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", padding: 12, display: "flex", flexDirection: "column", ...((compact || w1440) ? {} : { height: api.height ?? 205 }), transition: "background-color 0.15s ease", cursor: "pointer" }} onClick={() => setSelectedApi(api)}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {api.logoColor ? <div style={{ width: 41, height: 41, borderRadius: 3, backgroundColor: api.logoColor, flexShrink: 0 }} /> : <img src={api.logo} alt={api.name} width={41} height={41} style={{ display: "block" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: w1440 ? 12 : 14, letterSpacing: w1440 ? "-0.6px" : "-0.7px", color: isDark ? "#9e9e9e" : "#656363", cursor: "pointer" }}>Get example</span>
                <div style={{ borderRadius: 4, backgroundColor: isDark ? "#2d2d2d" : "#efefef", padding: "4px 6px" }}>
                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, color: isDark ? "#9e9e9e" : "#656363" }}>{api.tag ?? "API Key"}</span>
                </div>
              </div>
            </div>
            <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: compact || w1440 ? 14 : 16, fontWeight: 600, letterSpacing: compact || w1440 ? "-0.7px" : "-0.8px", color: isDark ? "#f7f7f7" : "#585858", marginTop: w1440 ? 10 : 11 }}>{api.name}</span>
            <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: compact || w1440 ? 12 : 14, letterSpacing: compact || w1440 ? "-0.48px" : "-0.56px", color: isDark ? "#adadad" : "#939393", lineHeight: "20px", marginTop: w1440 ? 4 : 3 }}>{api.desc}</span>
            {api.keyLabel ? (
              <div style={{ borderRadius: 4, backgroundColor: isDark ? "#2a1f0f" : (api.panelBg ?? "#fff4e8"), border: isDark ? "1px solid #3a2a18" : (api.panelBorder ?? "0.8px solid #FFE8CC"), width: 112, height: 26, padding: "0 6px", display: "flex", alignItems: "center", gap: 8, marginTop: (compact || w1440) ? 8 : "auto" }}>
                <svg viewBox="0 0 18 18" width={18} height={18} fill="none" style={{ display: "block", flexShrink: 0 }}>
                  <rect width="18" height="18" fill="rgb(255,255,255)" fillOpacity="0" />
                  <path d="M16.2188 8.63655C12.9487 7.79355 10.3935 5.2383 9.5505 1.9683L9.1875 0.560547L8.8245 1.9683C7.9815 5.2383 5.42629 7.79355 2.15629 8.63655L0.748535 8.99955L2.15629 9.3633C5.42629 10.2063 7.9815 12.7615 8.8245 16.0308L9.1875 17.4393L9.5505 16.0308C10.3935 12.7615 12.9487 10.2063 16.2188 9.3633L17.6265 8.99955L16.2188 8.63655Z" fill="rgb(13,140,13)" fillRule="evenodd" />
                  <path d="M14.2509 5.81025C14.2509 4.93875 15.2064 3.936 16.1252 3.936C15.2409 3.936 14.2509 2.92275 14.2509 2.0625C14.2509 2.92275 13.2699 3.936 12.3774 3.936C13.2362 3.936 14.2509 4.9335 14.2509 5.81025Z" fill="rgb(13,140,13)" fillRule="evenodd" />
                </svg>
                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: w1440 ? 12 : 14, fontWeight: 500, color: isDark ? "#DC7800" : (api.labelColor ?? "#DC7800"), whiteSpace: "nowrap", letterSpacing: w1440 ? -0.6 : -0.7 }}>{api.keyLabel}</span>
              </div>
            ) : (
              <div style={{ borderRadius: 4, backgroundColor: isDark ? "#2a1f0f" : (api.panelBg ?? "#fff4e8"), border: isDark ? "1px solid #3a2a18" : (api.panelBorder ?? "0.8px solid #FFE8CC"), padding: 8, display: "flex", flexDirection: "column", gap: 4, marginTop: (compact || w1440) ? 8 : "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src="/star-icon.png" alt="" width={18} height={18} style={{ display: "block", flexShrink: 0 }} />
                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: compact ? 14 : w1440 ? 12 : 16, fontWeight: 500, letterSpacing: compact ? "-0.7px" : w1440 ? "-0.6px" : "-0.8px", color: isDark ? "#DC7800" : (api.labelColor ?? "#DC7800"), whiteSpace: "nowrap" }}>{api.keyLabel ?? "Need a key"}</span>
                  <div style={{ flex: 1, minWidth: 0 }} />
                </div>
                {api.keyDesc ? <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: compact || w1440 ? 12 : 14, letterSpacing: compact || w1440 ? "-0.48px" : "-0.56px", color: "#DC7800", lineHeight: "20px" }}>{api.keyDesc}</span> : null}
              </div>
            )}
          </div>
))}
        </motion.div>
        </div>
        {showMoreFrame && (
          <motion.div
            key={`more-${activeFilter}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ position: "absolute", bottom: 16, left: 0, right: 0, margin: "0 auto", width: 516, maxWidth: "calc(100% - 32px)", height: 77, borderRadius: 10, border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#1b1b1b" : "#FCFCFC", padding: 16, boxSizing: "border-box" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.8px", color: isDark ? "#f7f7f7" : "#222222" }}>More APIs coming soon</span>
              <div style={{ borderRadius: 6, backgroundColor: "#5A5AFF", padding: "6px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: "#ffffff" }}>Suggest API</span>
              </div>
            </div>
            <span style={{ position: "absolute", left: 16, top: 41, right: 16, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", lineHeight: "20px", color: isDark ? "#adadad" : "#939393", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{frameText}. Got one you want to see here?</span>
          </motion.div>
        )}
        </div>
      <AnimatePresence>
        {showTopBlur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 32, zIndex: 10, pointerEvents: "none", borderRadius: "8px 8px 0 0", background: isDark ? "linear-gradient(to bottom, rgba(27, 27, 27, 0.85), rgba(27, 27, 27, 0))" : "linear-gradient(to bottom, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", maskImage: "linear-gradient(to bottom, black 20%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 100%)" }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBottomBlur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, zIndex: 10, pointerEvents: "none", borderRadius: "0 0 8px 8px", background: isDark ? "linear-gradient(to top, rgba(27, 27, 27, 0.85), rgba(27, 27, 27, 0))" : "linear-gradient(to top, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", maskImage: "linear-gradient(to top, black 20%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 20%, transparent 100%)" }}
          />
        )}
      </AnimatePresence>
      </div>
      <AnimatePresence>
        {selectedApi && (
          <>
          <motion.div
            key="api-modal-glass"
            className="fixed inset-0"
            style={{ zIndex: 75, pointerEvents: "auto", backdropFilter: "blur(36.75px)", WebkitBackdropFilter: "blur(36.75px)", background: isDark ? "linear-gradient(-23.5deg, rgba(36,36,36,0.47), rgba(129,129,129,0))" : "linear-gradient(-23.5deg, rgba(180,180,180,0.47), rgba(230,230,230,0))" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={() => setSelectedApi(null)}
          />
          <motion.div
            key="api-modal"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ position: "fixed", left: "50%", top: "50%", width: 394, height: detailBig ? 383 : 381, marginLeft: -197, marginTop: detailBig ? -191.5 : -190.5, zIndex: 80, backgroundColor: isDark ? "#0f0f0f" : "#ffffff", borderRadius: 12, boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.6)" : "0 24px 60px rgba(0,0,0,0.18)", border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", boxSizing: "border-box" }}
          >
              <motion.div initial="hidden" animate="visible" exit="exit" variants={cardContentVariants} style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
            <motion.div variants={cardItemVariants} style={{ position: "absolute", left: 12, top: 16, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => setSelectedApi(null)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M8.77563 7.75953L8.77665 7.99559C8.77665 8.97668 8.71919 9.87112 8.63265 10.4542L8.55683 10.8168C8.51465 11.0088 8.45919 11.2275 8.40138 11.3391C8.18974 11.7474 7.77593 12 7.33303 12L7.29448 12C7.00576 11.9905 6.39922 11.7371 6.39922 11.7283C5.42323 11.3188 3.54031 10.0829 2.67067 9.20174L2.41795 8.93721C2.35178 8.86551 2.27743 8.78066 2.23127 8.71452C2.07709 8.51037 2 8.25776 2 8.00514C2 7.72315 2.08654 7.46099 2.25018 7.24656L2.50982 6.96635L2.56799 6.90655C3.35707 6.05104 5.41741 4.6521 6.49522 4.22398L6.65794 4.16161C6.85376 4.09143 7.12812 4.00771 7.29448 4C7.50611 4 7.70829 4.0492 7.90102 4.14614C8.14174 4.28199 8.33374 4.49642 8.43992 4.74904C8.50756 4.92381 8.61374 5.44887 8.61374 5.45842C8.71108 5.98783 8.76752 6.82321 8.77563 7.75953ZM14 8.00029C14 8.55913 13.5513 9.01223 12.9978 9.01223L10.5317 8.79413C10.0975 8.79413 9.74551 8.4387 9.74551 8.00029C9.74551 7.56115 10.0975 7.20646 10.5317 7.20646L12.9978 6.98836C13.5513 6.98836 14 7.44145 14 8.00029Z" fill={isDark ? "#adadad" : "#939393"} fillRule="nonzero" />
              </svg>
              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#adadad" : "#939393" }}>Back to discovery</span>
            </motion.div>
            <motion.div variants={cardItemVariants} style={{ position: "absolute", left: 12, top: detailBig ? 44 : 40, display: "flex", alignItems: "center", gap: 4, borderRadius: 6, backgroundColor: isDark ? "#1a1a2e" : "#e4e4ff", padding: "4px 8px" }}>
              {selectedApi.logoColor ? <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: selectedApi.logoColor, flexShrink: 0 }} /> : <img src={selectedApi.logo} alt="" width={16} height={16} style={{ display: "block", borderRadius: 3, flexShrink: 0 }} />}
              <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: "#5a5aff" }}>{selectedApi.name} Starter request</span>
            </motion.div>
            <div style={{ position: "absolute", left: 12, top: 76, width: 370, height: detailBig ? 295 : 289, borderRadius: 10, border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#161616" : "#ffffff", boxSizing: "border-box", overflow: "hidden" }}>
            <motion.div initial="hidden" animate="visible" exit="exit" variants={cardContentVariants} style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
              <motion.span variants={cardItemVariants} style={{ position: "absolute", left: 12, top: 12, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.8px", color: isDark ? "#f7f7f7" : "#585858" }}>Test an endpoint</motion.span>
              <motion.span variants={cardItemVariants} style={{ position: "absolute", left: 12, top: 37, right: 12, fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: isDark ? "#adadad" : "#939393", lineHeight: "20px" }}>{selectedApi.desc}</motion.span>
              {selectedApi.keyDesc ? (
                <motion.div variants={cardItemVariants} style={{ position: "absolute", left: 12, top: 73, width: 346, height: detailBig ? 74 : 72, borderRadius: 8, outline: isDark ? "0.6px solid #3a2a18" : "0.6px solid #FFDAAD", backgroundColor: isDark ? "#2a1f0f" : "#FFFCFA" }}>
                  <div style={{ position: "absolute", left: 8, top: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <img src="/star-icon.png" alt="" width={16} height={16} style={{ display: "block", flexShrink: 0 }} />
                    <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: detailBig ? 14 : 12, fontWeight: 500, letterSpacing: detailBig ? "-0.7px" : "-0.6px", color: isDark ? "#f0ad55" : "#DC7800" }}>Need a key</span>
                  </div>
                  <span style={{ position: "absolute", right: 8, top: 8, fontFamily: "Geist, var(--font-geist-sans)", fontSize: detailBig ? 14 : 12, fontWeight: 500, letterSpacing: detailBig ? "-0.7px" : "-0.6px", color: isDark ? "#f0ad55" : detailBig ? "#69380A" : "#693900", cursor: "pointer" }}>Get a key</span>
                  <div style={{ position: "absolute", left: 4, top: detailBig ? 34 : 32, width: 338, height: detailBig ? 36 : 36, borderRadius: 6, backgroundColor: isDark ? "#3a2a18" : "#FFF2E0" }}>
                    <span style={{ position: "absolute", left: 8, top: 8, right: 8, fontFamily: "Geist, var(--font-geist-sans)", fontSize: detailBig ? 14 : 12, lineHeight: "20px", letterSpacing: detailBig ? "-0.56px" : "-0.48px", color: isDark ? "#f0ad55" : "#A85C00", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{selectedApi.keyDesc}</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={cardItemVariants} style={{ position: "absolute", left: 12, top: 73, width: 346, height: detailBig ? 74 : 72, borderRadius: 8, backgroundColor: isDark ? "#1a2f1a" : "#E4FEE4", boxSizing: "border-box" }}>
                  <div style={{ position: "absolute", left: 8, top: 25, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg viewBox="0 0 18 18" width={16} height={16} fill="none" style={{ display: "block", flexShrink: 0 }}>
                      <rect width="18" height="18" fill="rgb(255,255,255)" fillOpacity="0" />
                      <path d="M16.2188 8.63655C12.9487 7.79355 10.3935 5.2383 9.5505 1.9683L9.1875 0.560547L8.8245 1.9683C7.9815 5.2383 5.42629 7.79355 2.15629 8.63655L0.748535 8.99955L2.15629 9.3633C5.42629 10.2063 7.9815 12.7615 8.8245 16.0308L9.1875 17.4393L9.5505 16.0308C10.3935 12.7615 12.9487 10.2063 16.2188 9.3633L17.6265 8.99955L16.2188 8.63655Z" fill="rgb(13,140,13)" fillRule="evenodd" />
                      <path d="M14.2509 5.81025C14.2509 4.93875 15.2064 3.936 16.1252 3.936C15.2409 3.936 14.2509 2.92275 14.2509 2.0625C14.2509 2.92275 13.2699 3.936 12.3774 3.936C13.2362 3.936 14.2509 4.9335 14.2509 5.81025Z" fill="rgb(13,140,13)" fillRule="evenodd" />
                    </svg>
                    <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, color: "#0d8c0d" }}>Ready to send</span>
                  </div>
                </motion.div>
              )}
              <motion.div variants={cardItemVariants} style={{ position: "absolute", left: 12, top: detailBig ? 155 : 161, width: 346, height: detailBig ? 128 : 116, borderRadius: 8, border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#161616" : "#ffffff", boxSizing: "border-box" }}>
                <div style={{ position: "absolute", left: 8, top: detailBig ? 10 : 8, display: "flex", alignItems: "center", gap: 4, borderRadius: 6, border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#1f1f1f" : "#FCFCFC", padding: "6px 6px", height: detailBig ? 30 : 28, boxSizing: "border-box" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#008000", flexShrink: 0 }} />
                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: detailBig ? 14 : 12, letterSpacing: detailBig ? "-0.56px" : "-0.48px", color: isDark ? "#d1d1d1" : "#595959" }}>GET</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l6 6 6-6" stroke={isDark ? "#9e9e9e" : "#595959"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ position: "absolute", left: detailBig ? 89 : 86, top: 8, width: detailBig ? 249 : 252, height: detailBig ? 34 : 28, borderRadius: 6, border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#1b1b1b" : "#ffffff", boxSizing: "border-box" }}>
                  <span style={{ position: "absolute", left: 8, top: detailBig ? 8 : 6, right: 8, fontFamily: "Geist, var(--font-geist-sans)", fontSize: detailBig ? 14 : 12, letterSpacing: detailBig ? "-0.56px" : "-0.48px", color: isDark ? "#d1d1d1" : "#5E5E5E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedApi.url}</span>
                </div>
                {selectedApi.auth ? (
                  <div style={{ position: "absolute", left: 8, top: detailBig ? 50 : 44, width: 330, height: detailBig ? 34 : 28, borderRadius: 6, border: isDark ? "0.8px solid #2d2d2d" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#1b1b1b" : "#ffffff", boxSizing: "border-box" }}>
                    <span style={{ position: "absolute", left: 8, top: detailBig ? 8 : 6, right: 8, fontFamily: "Geist, var(--font-geist-sans)", fontSize: detailBig ? 14 : 12, letterSpacing: detailBig ? "-0.56px" : "-0.48px", color: "#9e9e9e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedApi.auth}</span>
                  </div>
                ) : null}
                <div style={{ position: "absolute", left: 8, top: selectedApi.auth ? (detailBig ? 92 : 80) : (detailBig ? 50 : 44), display: "flex", alignItems: "center", gap: 4, borderRadius: 6, backgroundColor: "#5A5AFF", padding: "6px 6px", height: 28, boxSizing: "border-box" }}>
                  <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, letterSpacing: "-0.48px", color: "#ffffff" }}>Send</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3.333 8h9.334" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 3.333l4.667 4.667L8 12.667" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>
            </motion.div>
            </div>
            </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function UrlInputBar({  compact,  activeTheme,  method,  setMethod,  url,  setUrl,  loading,  onSend,}: {  compact?: boolean;  activeTheme: string;
  method: string;
  setMethod: (m: string) => void;
  url: string;
  setUrl: (u: string) => void;
  loading: boolean;
  onSend: (opts?: { method?: string;
 url?: string;
 headers?: Record<string, string> }) => void;
}) {  const isDark = activeTheme === "Dark";
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredMethod, setHoveredMethod] = useState("GET");
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const popupContent: Record<string, { title: string;
 status: string;
 rows: [string, string, string, string][];
 jsonLabel: boolean;
 label: string;
 description: string;
 description2: string }> = {    GET: {      title: "/api/users/1",      status: "200",      rows: [        ["\u201Cid\u201D", ":", "1", ","],        ["\u201Cname\u201D", ":", "\u201CAda lovelace\u201D", ","],        ["\u201Cemail\u201D", ":", "\u201Cada@x.com\u201D", ","],      ],      jsonLabel: false,      label: "GET",      description: "Retrieve data from a resource without changing anything.",      description2: "",    },    POST: {      title: "POST",      status: "201 Created",      rows: [        ["\u201Cid\u201D", ":", "2", ","],        ["\u201Cname\u201D", ":", "\u201CGrace Hopper\u201D", ","],        ["\u201Cemail\u201D", ":", "\u201Cgrace@x.com\u201D", ","],      ],      jsonLabel: true,      label: "POST",      description: "Create a new resource with the data",      description2: "you send.",    },    PUT: {      title: "PUT",      status: "200 OK",      rows: [        ["\u201Cid\u201D", ":", "1", ","],        ["\u201Cname\u201D", ":", "\u201CAda Lovelace\u201D", ","],        ["\u201Cemail\u201D", ":", "\u201Cada@newmail.com\u201D", ","],      ],      jsonLabel: true,      label: "PUT",      description: "Replace a resource completely with new data.",      description2: "",    },    PATCH: {      title: "PATCH",      status: "200 OK",      rows: [        ["\u201Cid\u201D", ":", "1", ","],        ["\u201Cemail\u201D", ":", "\u201Cada@newmail.com\u201D", ","],      ],      jsonLabel: true,      label: "PATCH",      description: "Update part of a resource without replacing the rest.",      description2: "",    },    DELETE: {      title: "DELETE",      status: "204 No Content",      rows: [],      jsonLabel: true,      label: "DELETE",      description: "Remove a resource permanently.",      description2: "",    },  };
  const content = popupContent[hoveredMethod] ?? popupContent.GET;
  const isGetCode = content === popupContent.GET;
  const keyColor = isGetCode ? (isDark ? "#5bbbe8" : "#0396dc") : (isDark ? "#e9a5aa" : "#d07279");
  const numColor = isGetCode ? (isDark ? "#bd766a" : "#992c1a") : (isDark ? "#75d5d5" : "#2fb4b4");
  const [localUrl, setLocalUrl] = useState(url);
  useEffect(() => { setLocalUrl(url);
 }, [url]);
  return (    <div      className={`relative flex ${compact ? "w-[393px]" : "w-[467px]"} items-center gap-4 rounded-lg p-3`}      style={{        border: isDark ? "0.8px solid #2a2a2a" : "0.8px solid #f2f2f2",        borderRadius: 8,        backgroundColor: isDark ? "#121212" : "#ffffff",      }}    >      <div className="relative">        <button          onClick={() => { setShowDropdown(!showDropdown);
 setHoveredMethod(method);
 }}          className="flex items-center gap-1 px-2 py-1.5"          style={{ border: isDark ? "0.8px solid #2a2a2a" : "0.8px solid #f2f2f2", borderRadius: 6, backgroundColor: isDark ? "#1f1f1f" : "#fcfcfc" }}        >          <span className={`flex items-center gap-1 text-xs ${isDark ? "text-white" : "text-[#5a5a5a]"}`}>            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: methodDots[method] }} />            {method}          </span>          <motion.svg            width="17"            height="16"            viewBox="0 0 17 16"            fill="none"            animate={{ rotate: showDropdown ? 180 : 0 }}            transition={cardTextSpring}            style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}          >            <path d="M4 6l6 6 6-6" stroke="#5a5a5a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />          </motion.svg>        </button>        <AnimatePresence>        {showDropdown && (          <motion.div            className="absolute z-10"            onMouseLeave={() => setHoveredMethod(method)}            initial={{ opacity: 0, y: -8 }}            animate={{ opacity: 1, y: 0 }}            exit={{ opacity: 0, y: -8 }}            transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}            style={{              left: compact ? -12 : -20,
              top: "calc(100% + 18px)",
              width: compact ? 393 : 471,
              height: 250,              borderRadius: 8,              backgroundColor: isDark ? "#0f0f0f" : "#ffffff",              border: isDark ? "0.8px solid #312f2f" : "none",              boxShadow: isDark ? "0 12px 14px rgba(61, 61, 61, 0.5)" : "0 12px 14px rgba(219, 219, 219, 0.30)",            }}          >            {methods.map((m, i) => (              <button                key={m}                onClick={() => {                  setMethod(m);
                  setShowDropdown(false);
                }}                onMouseEnter={() => setHoveredMethod(m)}                style={{                  position: "absolute",                  left: 16,                  top: 16 + i * 44,                  width: 190,                  height: 32,                  display: "flex",                  alignItems: "center",                  gap: 4,                  padding: "8px 12px",                  borderRadius: 6,                  backgroundColor: hoveredMethod === m ? (isDark ? "#1f1f1f" : "#f7f7f7") : "transparent",                }}              >                <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: methodDots[m], flexShrink: 0 }} />                <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "-0.48px", color: isDark ? "#d1d1d1" : "#5a5a5a", fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{m}</span>              </button>            ))}            <div style={{ position: "absolute", left: 214, top: 16, width: 0.8, height: 218, backgroundColor: isDark ? "#2d2d2d" : "#f2f2f2" }} />            <div style={{ position: "absolute", left: compact ? 216 : 223, top: 16, width: compact ? 170 : 232, height: 160, borderRadius: 6, backgroundColor: isDark ? "#1b1b1b" : "#fafafa" }}>              <AnimatePresence mode="wait">              <motion.div                key={hoveredMethod}                initial="hidden"                animate="visible"                exit={{ opacity: 0 }}                transition={{ duration: 0.15 }}                variants={cardContentVariants}              >              <motion.div variants={cardItemVariants} style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4 }}>                <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-0.6px", color: isDark ? "#f7f7f7" : "#585858", fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{content.title}</span>                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2px 4px", borderRadius: 6, backgroundColor: isDark ? "#003b00" : "#caffca" }}>                  <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "-0.48px", color: isDark ? "#7ef97e" : "#008000", fontFamily: "Geist, var(--font-geist-sans)" }}>{content.status}</span>                </span>              </motion.div>              <motion.div variants={cardItemVariants} style={{ position: "absolute", top: 36, left: 8, width: 216, height: 116, borderRadius: 4, backgroundColor: isDark ? "#0f0f0f" : "#ffffff" }}>                {content.jsonLabel && (                  <span style={{ position: "absolute", top: 4, left: 193, fontSize: 10, fontWeight: 500, letterSpacing: "-0.4px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>json</span>                )}                {content.rows.length === 0 ? (                  <>                    <span style={{ position: "absolute", top: 49, left: 100, fontSize: 14, fontWeight: 500, letterSpacing: "-0.56px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>{"{"}</span>                    <span style={{ position: "absolute", top: 49, left: 110, fontSize: 14, fontWeight: 500, letterSpacing: "-0.56px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>{"}"}</span>                  </>                ) : (                  <>                    <span style={{ position: "absolute", top: 4, left: 7, fontSize: 14, fontWeight: 500, letterSpacing: "-0.56px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>{"{"}</span>                    <span style={{ position: "absolute", top: 94, left: 7, fontSize: 14, fontWeight: 500, letterSpacing: "-0.56px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>{"}"}</span>                  </>                )}                {content.rows.map(([k, c, v, cm], i) => (                  <div key={k} style={{ position: "absolute", top: 50 - ((content.rows.length - 1) * 20) / 2 + i * 20, left: 21, display: "flex", alignItems: "center" }}>                    <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: keyColor, fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{k}</span>                    <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{c}</span>                    <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: v.startsWith("\u201C") ? (isDark ? "#6bdc94" : "#1bc95a") : numColor, fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{v}</span>                    <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)", whiteSpace: "nowrap" }}>{cm}</span>                  </div>                ))}              </motion.div>              </motion.div>              </AnimatePresence>            </div>            <AnimatePresence mode="wait">            <motion.div              key={hoveredMethod}              initial="hidden"              animate="visible"              exit={{ opacity: 0 }}              transition={{ duration: 0.15 }}              variants={cardContentVariants}            >            <motion.span variants={cardItemVariants} style={{ position: "absolute", top: 184, left: 223, fontSize: 12, fontWeight: 500, letterSpacing: "-0.48px", color: isDark ? "#f7f7f7" : "#242424", fontFamily: "Geist, var(--font-geist-sans)" }}>{content.label}</motion.span>            <motion.span variants={cardItemVariants} style={{ position: "absolute", top: 204, left: 223, width: 227, fontSize: 12, fontWeight: 400, letterSpacing: "-0.48px", color: isDark ? "#adadad" : "#595959", fontFamily: "Geist, var(--font-geist-sans)" }}>{content.description}</motion.span>            {content.description2 && (              <motion.span variants={cardItemVariants} style={{ position: "absolute", top: 221, left: 223, width: 227, fontSize: 12, fontWeight: 400, letterSpacing: "-0.48px", color: isDark ? "#adadad" : "#595959", fontFamily: "Geist, var(--font-geist-sans)" }}>{content.description2}</motion.span>            )}            </motion.div>            </AnimatePresence>          </motion.div>              )}            </AnimatePresence>      </div>      <input        type="text"        placeholder="Paste an API endpoint..."        value={localUrl}        onChange={(e) => { setLocalUrl(e.target.value);
 setUrl(e.target.value);
 }}        className={`flex-1 bg-transparent text-sm tracking-[-0.04em] outline-none ${isDark ? "text-[#d1d1d1] placeholder:text-[#d1d1d1]" : "text-[#9e9e9e] placeholder:text-[#9e9e9e]"}`}        style={{ fontFamily: "Geist, var(--font-geist-sans)" }}      />      <button        onClick={() => onSend()}        disabled={loading}        className="flex items-center gap-1 px-2 py-1.5 text-xs text-white tracking-[-0.04em] transition-colors hover:bg-[#4a4aff] disabled:opacity-60"        style={{ borderRadius: 6, backgroundColor: "#5b5bff" }}      >        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">          <path d="M3.333 8h9.334" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />          <path d="M8 3.333l4.667 4.667L8 12.667" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />        </svg>        <span>Send</span>      </button>    </div>  );
}function IconlyPlus({ size = 24, color = "#5B5BFF" }: { size?: number;
 color?: string }) {  return (    <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">      <path fillRule="evenodd" clipRule="evenodd" d="M15.8279 13.2847H12.9999V16.1087C12.9999 16.5227 12.6639 16.8587 12.2499 16.8587C11.8359 16.8587 11.4999 16.5227 11.4999 16.1087V13.2847H8.67194C8.25794 13.2847 7.92194 12.9487 7.92194 12.5347C7.92194 12.1207 8.25794 11.7847 8.67194 11.7847H11.4999V8.96067C11.4999 8.54667 11.8359 8.21067 12.2499 8.21067C12.6639 8.21067 12.9999 8.54667 12.9999 8.96067V11.7847H15.8279C16.2419 11.7847 16.5779 12.1207 16.5779 12.5347C16.5779 12.9487 16.2419 13.2847 15.8279 13.2847ZM12.2499 2.29767C4.69094 2.29767 2.01294 4.97567 2.01294 12.5347C2.01294 20.0937 4.69094 22.7717 12.2499 22.7717C19.8079 22.7717 22.4869 20.0937 22.4869 12.5347C22.4869 4.97567 19.8079 2.29767 12.2499 2.29767Z" fill={color} />    </svg>  );
}function JsonView({ data, depth = 0 }: { data: any;
 depth?: number }) {  const indent = depth * 16;
  if (data === null) return <span style={{ color: "#FE7C0B" }}>null</span>;
  if (typeof data === "boolean") return <span style={{ color: "#FE7C0B" }}>{String(data)}</span>;
  if (typeof data === "number") return <span style={{ color: "#FE7C0B" }}>{data}</span>;
  if (typeof data === "string") {    return (      <span>        <span style={{ color: "#9e9e9e" }}>"</span>        <span style={{ color: "#1BC95A" }}>{data}</span>        <span style={{ color: "#9e9e9e" }}>"</span>      </span>    );
  }  if (Array.isArray(data)) {    if (data.length === 0) return <span style={{ color: "#9e9e9e" }}>[]</span>;
    return (      <>        <span style={{ color: "#9e9e9e" }}>[</span>        {data.map((item, i) => (          <div key={i} style={{ paddingLeft: indent + 16 }}>            <JsonView data={item} depth={depth + 1} />            {i < data.length - 1 && <span style={{ color: "#9e9e9e" }}>,</span>}          </div>        ))}        <div style={{ paddingLeft: indent }}>          <span style={{ color: "#9e9e9e" }}>]</span>        </div>      </>    );
  }  if (typeof data === "object" && data !== null) {    const keys = Object.keys(data);
    if (keys.length === 0) return <span style={{ color: "#9e9e9e" }}>{'{}'}</span>;
    return (      <>        <span style={{ color: "#9e9e9e" }}>{'{'}</span>        {keys.map((key, i) => (          <div key={key} style={{ paddingLeft: indent + 16 }}>            <span style={{ color: "#9e9e9e" }}>"</span>            <span style={{ color: "#0396DC" }}>{key}</span>            <span style={{ color: "#9e9e9e" }}>"</span>            <span style={{ color: "#9e9e9e" }}>: </span>            <JsonView data={data[key]} depth={depth + 1} />            {i < keys.length - 1 && <span style={{ color: "#9e9e9e" }}>,</span>}          </div>        ))}        <div style={{ paddingLeft: indent }}>          <span style={{ color: "#9e9e9e" }}>{'}'}</span>        </div>      </>    );
  }  return <span style={{ color: "#9e9e9e" }}>{String(data)}</span>;
}function BodyViewer({ body, isDark }: { body: string;
 isDark: boolean }) {  const [tab, setTab] = useState("pretty");
  let parsed: any = null;
  try { parsed = JSON.parse(body);
 } catch {}  const isJson = parsed !== null && typeof parsed === "object";
  return (    <div style={{ borderRadius: 8, border: isDark ? "0.8px solid #312f2f" : "0.8px solid #f2f2f2", backgroundColor: isDark ? "#0f0f0f" : "#fcfcfc", width: "100%" }}>      <div className="flex items-center" style={{ padding: "12px 12px 0" }}>        <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: isDark ? "#ffffff" : "#9e9e9e" }}>Body</span>        <div className="flex items-center" style={{ borderRadius: 12, backgroundColor: isDark ? "#262626" : "#f2f2f2", padding: 4, gap: 8, marginLeft: "auto" }}>          <div onClick={() => setTab("pretty")} style={{ borderRadius: 8, backgroundColor: tab === "pretty" ? (isDark ? "#1b1b1b" : "#fff") : "transparent", padding: "4px 6px", cursor: "pointer" }}>            <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: tab === "pretty" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>Pretty</span>          </div>          <div onClick={() => setTab("raw")} style={{ borderRadius: 8, backgroundColor: tab === "raw" ? (isDark ? "#1b1b1b" : "#fff") : "transparent", padding: "4px 6px", cursor: "pointer" }}>            <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: tab === "raw" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>Raw</span>          </div>        </div>      </div>      {tab === "pretty" && isJson ? (<div className="hide-scrollbar" style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, maxHeight: 310, overflowY: "auto", overflowX: "hidden", wordBreak: "break-word", padding: "8px 12px 12px" }}>          <JsonView data={parsed} />        </div>      ) : (        <pre className="hide-scrollbar" style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 14, fontWeight: 500, color: "#9e9e9e", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 310, overflowY: "auto", margin: 0, padding: "8px 12px 12px" }}>{body}</pre>      )}    </div>  );
}
function MobileResultSection({ activeTheme, method, url, response, headersFilter, setHeadersFilter }: {
  activeTheme: string;
  method: string;
  url: string;
  response: { status?: number; time?: number; headers?: Record<string, string>; body?: string; error?: string } | null;
headersFilter: string;
  setHeadersFilter: (v: string) => void;
}) {
  const isDark = activeTheme === "Dark";
  const [bodyTab, setBodyTab] = useState("pretty");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [showTopBlur, setShowTopBlur] = useState(false);
  const [showBottomBlur, setShowBottomBlur] = useState(false);
  const bodyContentEl = useRef<HTMLElement | null>(null);
  const [bodyContentHeight, setBodyContentHeight] = useState(0);
  useLayoutEffect(() => {
    if (bodyContentEl.current) setBodyContentHeight(bodyContentEl.current.scrollHeight);
  });
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) {
      setShowTopBlur(false);
      setShowBottomBlur(false);
    } else {
      setShowTopBlur(el.scrollTop > 2);
      setShowBottomBlur(el.scrollTop < max - 2);
    }
  }, [response, bodyContentHeight]);
  const handleScroll = () => {
    const el = rootRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) {
      setShowTopBlur(false);
      setShowBottomBlur(false);
      return;
    }
    setShowTopBlur(el.scrollTop > 2);
    setShowBottomBlur(el.scrollTop < max - 2);
  };
  let parsedBody: any = null;
  let isJson = false;
  if (response) {
    try {
      parsedBody = JSON.parse(response.body || "{}");
      isJson = typeof parsedBody === "object" && parsedBody !== null;
    } catch {}
  }
  const isError = response ? (response.error || (response.status != null && response.status >= 400)) : false;
  const sc = isError
    ? { bg: isDark ? "#7d0000" : "#ffdddd", text: isDark ? "#ffa4a4" : "#ff4e4e" }
    : { bg: isDark ? "#003b00" : "#caffca", text: isDark ? "#7ef97e" : "#008000" };
  const hdrs = response?.headers || {};
  const allHeaders = Object.entries(hdrs);
  const filteredHeaders = headersFilter === "common"
    ? allHeaders.filter(([k]) => commonKeys.includes(k.toLowerCase()))
    : allHeaders;
  const bodyCardTop = 62 + filteredHeaders.length * 32;
  const responseCardHeight = response ? bodyCardTop + (41 + bodyContentHeight + 12) + 12 : 480;
const bodyEntries = isJson ? Object.entries(parsedBody) : [];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={rootRef} onScroll={handleScroll} className="hide-scrollbar" style={{ position: "relative", width: "100%", height: "100%", overflowY: "auto" }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }} style={{ position: "absolute", right: 12, top: 42, width: 181, height: 50, borderRadius: 10, backgroundColor: "#f7f7f7", display: "flex", alignItems: "center", padding: "0 16px" }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: methodDots[method] || "#008000", flexShrink: 0 }} />
        <span style={{ fontSize: 14, color: isDark ? "#d1d1d1" : "#5a5a5a", fontFamily: "Geist, var(--font-geist-sans)", flexShrink: 0, marginLeft: 4, marginRight: 4 }}>{method}</span>
        <span style={{ fontSize: 14, color: isDark ? "#8c8c8c" : "#767676", fontFamily: "Geist, var(--font-geist-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }} style={{ position: "absolute", left: 287, top: 104, display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" stroke={isDark ? "#8c8c8c" : "#9e9e9e"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 3.5l3 3" stroke={isDark ? "#8c8c8c" : "#9e9e9e"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 12, color: isDark ? "#8c8c8c" : "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)" }}>Edit</span>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.45 }} style={{ position: "absolute", left: 12, right: 12, top: 144, height: responseCardHeight, borderRadius: 10, backgroundColor: "#f7f7f7", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          {!response ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
              <LoadingState label="Sending" variant="Drive" dark={isDark} />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", left: 12, top: 12, width: 42, height: 26, borderRadius: 6, backgroundColor: sc.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, color: sc.text, fontFamily: "Geist, var(--font-geist-sans)" }}>{response.status || "Error"}</span>
        </div>
        {response.time != null && (
          <span style={{ position: "absolute", left: 63, top: 16, fontSize: 14, color: isDark ? "#d1d1d1" : "#585858", fontFamily: "Geist, var(--font-geist-sans)" }}>{response.time}ms</span>
        )}
        <div onClick={() => setHeadersFilter("common")} style={{ position: "absolute", right: 75, top: 14, width: 53, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
          <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", color: headersFilter === "common" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>Common</span>
          <div style={{ width: "100%", height: 0, borderTop: headersFilter === "common" ? (isDark ? "1px solid #ffffff" : "1px solid #000") : (isDark ? "1px solid #1b1b1b" : "1px solid #f7f7f7") }} />
        </div>
        <div onClick={() => setHeadersFilter("all")} style={{ position: "absolute", right: 12, top: 14, width: 53, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
          <span style={{ fontFamily: "Geist, var(--font-geist-sans)", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", color: headersFilter === "all" ? (isDark ? "#ffffff" : "#222") : (isDark ? "#9e9e9e" : "#818181") }}>All</span>
          <div style={{ width: "100%", height: 0, borderTop: headersFilter === "all" ? (isDark ? "1px solid #ffffff" : "1px solid #000") : (isDark ? "1px solid #1b1b1b" : "1px solid #f7f7f7") }} />
        </div>
        <div style={{ position: "absolute", left: 12, top: 50, right: 12, height: 1, backgroundColor: isDark ? "#2d2d2f" : "#f2f2f2" }} />
        {filteredHeaders.map(([key, value], i) => (
          <div key={key} style={{ position: "absolute", left: 12, top: 62 + i * 32, fontSize: 12, fontWeight: 500, color: isDark ? "#8c8c8c" : "#9e9e9e", fontFamily: "Geist, var(--font-geist-sans)", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</div>
        ))}
        {filteredHeaders.map(([key, value], i) => (
          <div key={key + "-val"} style={{ position: "absolute", right: 12, top: 62 + i * 32, fontSize: 12, fontWeight: 500, color: isDark ? "#adadad" : "#606060", fontFamily: "Geist, var(--font-geist-sans)", textAlign: "right", maxWidth: "40%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "\u2014"}</div>
        ))}
        <div style={{ position: "absolute", left: 12, right: 12, top: bodyCardTop, height: 41 + bodyContentHeight + 12, borderRadius: 8, backgroundColor: isDark ? "#161616" : "#ffffff" }}>
          <div style={{ position: "absolute", left: 12, top: 19, fontSize: 14, fontWeight: 500, letterSpacing: "-0.48px", color: isDark ? "#ffffff" : "#222222", fontFamily: "Geist, var(--font-geist-sans)" }}>Body</div>
          <div style={{ position: "absolute", right: 12, top: 12, display: "flex", padding: 4, borderRadius: 12, backgroundColor: isDark ? "#262626" : "#f2f2f2", gap: 8 }}>
            <div onClick={() => setBodyTab("pretty")} style={{ padding: "4px 6px", borderRadius: 8, backgroundColor: bodyTab === "pretty" ? (isDark ? "#1b1b1b" : "#fff") : "transparent", cursor: "pointer" }}>
              <span style={{ fontSize: 12, letterSpacing: "-0.6px", color: bodyTab === "pretty" ? (isDark ? "#f7f7f7" : "#222222") : (isDark ? "#8c8c8c" : "#818181"), fontFamily: "Geist, var(--font-geist-sans)" }}>Pretty</span>
            </div>
            <div onClick={() => setBodyTab("raw")} style={{ padding: "4px 6px", borderRadius: 4, backgroundColor: bodyTab === "raw" ? (isDark ? "#262626" : "#f2f2f2") : "transparent", cursor: "pointer" }}>
              <span style={{ fontSize: 12, letterSpacing: "-0.6px", color: bodyTab === "raw" ? (isDark ? "#f7f7f7" : "#222") : (isDark ? "#8c8c8c" : "#818181"), fontFamily: "Geist, var(--font-geist-sans)" }}>Raw</span>
            </div>
          </div>
          {bodyTab === "pretty" && isJson ? (
            <div ref={(el) => { bodyContentEl.current = el; if (el) setBodyContentHeight(el.scrollHeight); }} className="hide-scrollbar" style={{ position: "absolute", top: 41, left: 12, right: 12, fontSize: 12, fontWeight: 500, fontFamily: "Geist, var(--font-geist-sans)" }}>
              <JsonView data={parsedBody} />
            </div>
          ) : (
            <pre ref={(el) => { bodyContentEl.current = el; if (el) setBodyContentHeight(el.scrollHeight); }} className="hide-scrollbar" style={{ position: "absolute", top: 41, left: 12, right: 12, fontSize: 12, fontWeight: 500, fontFamily: "Geist, var(--font-geist-sans)", color: isDark ? "#adadad" : "#737373", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
              {response.body || ""}
            </pre>
          )}
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>
      <AnimatePresence>
        {showTopBlur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 32, zIndex: 10, pointerEvents: "none", borderRadius: "16px 16px 0 0", background: isDark ? "linear-gradient(to bottom, rgba(22, 22, 22, 0.85), rgba(22, 22, 22, 0))" : "linear-gradient(to bottom, rgba(252, 252, 252, 0.85), rgba(252, 252, 252, 0))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", maskImage: "linear-gradient(to bottom, black 20%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 100%)" }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBottomBlur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, zIndex: 10, pointerEvents: "none", borderRadius: "0 0 16px 16px", background: isDark ? "linear-gradient(to top, rgba(22, 22, 22, 0.85), rgba(22, 22, 22, 0))" : "linear-gradient(to top, rgba(252, 252, 252, 0.85), rgba(252, 252, 252, 0))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", maskImage: "linear-gradient(to top, black 20%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 20%, transparent 100%)" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

export const LANDING_SAMPLE_GET_URL =
  "https://jsonplaceholder.typicode.com/users/1";

const LANDING_SAMPLE_RESPONSE = {
  status: "ok",
  node_id: "node_8f3a1c",
  network: "ethereum-mainnet",
  block_height: 20481923,
  latency_ms: 142,
  uptime: "99.98%",
} as const;

const LANDING_EXPLAIN = {
  who: "Infra teams monitoring node uptime and network health",
  what: "Skip building your own health-check polling from scratch",
  build:
    "A status dashboard that alerts you when uptime drops below a threshold",
} as const;

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

const responseReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: REVEAL_EASE, delay },
  }),
};

type TryItHereSectionProps = {
  onSend: () => void;
};

const LANDING_URL_PATH = "/v1/nodes/status";

export default function TryItHereSection({ onSend }: TryItHereSectionProps) {
  const [sent, setSent] = useState(false);
  const [bodyTab, setBodyTab] = useState<"pretty" | "raw">("pretty");

  return (
    <section
      aria-labelledby="try-it-here-heading"
      className="hidden lg:mt-8 lg:block"
    >
      <div
        className={`box-border flex w-full flex-col items-center rounded-xl border border-[#f2f2f2] bg-white pb-6 pt-6 ${
          sent ? "px-6" : "h-[221px]"
        }`}
      >
        <h2
          id="try-it-here-heading"
          className="text-center text-2xl font-semibold leading-normal tracking-[-0.05em] text-[#3d3d3d]"
          style={geist}
        >
          Try it right here
        </h2>
        <p
          className="mx-auto mt-2 max-w-[386px] text-center text-base font-normal leading-normal tracking-[-0.035em] text-[#707070]"
          style={geist}
        >
          Press send on a stipulated endpoint. Get a clear explanation and a build
          idea
        </p>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="composer"
              className="relative mt-4 h-[52px] w-[467px] overflow-hidden rounded-lg border border-[#f2f2f2] bg-white"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: REVEAL_EASE }}
            >
              <div className="absolute left-4 top-3 flex items-center gap-1 rounded-md border border-[#f2f2f2] bg-[#fcfcfc] px-2 py-1.5">
                <span
                  className="size-3 shrink-0 rounded-full bg-[#008000]"
                  aria-hidden
                />
                <span
                  className="text-xs font-normal tracking-[-0.04em] text-[#5a5a5a]"
                  style={geist}
                >
                  GET
                </span>
              </div>
              <p
                className="absolute left-[86px] top-[17px] max-w-[278px] truncate text-sm font-normal tracking-[-0.04em] text-[#3d3d3d]"
                style={geist}
                title={LANDING_URL_PATH}
              >
                {LANDING_URL_PATH}
              </p>
              <button
                type="button"
                onClick={() => setSent(true)}
                className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1 rounded-md bg-[#5b5bff] px-2 py-1.5 text-xs font-normal tracking-[-0.04em] text-white hover:bg-[#4f4fef] active:bg-[#4545e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bff]/45 focus-visible:ring-offset-2"
                style={geist}
              >
                Send
                <SendArrowIcon />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="response"
              className="mt-[46px] flex w-full flex-col self-stretch"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: REVEAL_EASE }}
            >
              <motion.div
                className="box-border min-h-[810px] w-full rounded-[10px] border border-[#f2f2f2] bg-white px-6 pt-4"
              >
              <motion.div
                className="flex justify-end"
                variants={responseReveal}
                custom={0.06}
                initial="hidden"
                animate="visible"
              >
                <div className="flex h-[50px] min-w-0 max-w-[240px] items-center gap-2 rounded-[10px] bg-[#fafafa] pl-4 pr-3">
                  <span
                    className="size-3 shrink-0 rounded-full bg-[#008000]"
                    aria-hidden
                  />
                  <span
                    className="shrink-0 text-sm tracking-[-0.04em] text-[#5a5a5a]"
                    style={geist}
                  >
                    GET
                  </span>
                  <span
                    className="truncate text-sm tracking-[-0.05em] text-[#767676]"
                    style={geist}
                  >
                    {LANDING_URL_PATH}
                  </span>
                </div>
              </motion.div>

              <motion.div
                className="mt-6 w-full max-w-[715px] rounded-lg bg-[#fafafa] p-4"
                variants={responseReveal}
                custom={0.14}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="flex items-center gap-2 border-b border-[#f2f2f2] pb-4"
                  variants={responseReveal}
                  custom={0.18}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex items-center justify-center rounded-md bg-[#caffca] px-2 py-1">
                    <span
                      className="text-sm tracking-[-0.04em] text-[#008000]"
                      style={geist}
                    >
                      200
                    </span>
                  </div>
                  <span
                    className="text-sm tracking-[-0.05em] text-[#585858]"
                    style={geist}
                  >
                    142ms
                  </span>
                </motion.div>

                <motion.div
                  className="relative mt-3 min-h-[310px] overflow-hidden rounded-md border border-[#f2f2f2] bg-white px-4 pb-4 pt-4"
                  variants={responseReveal}
                  custom={0.24}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium tracking-[-0.03em] text-[#222222]"
                      style={geist}
                    >
                      Body
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded bg-[#ebebeb] px-1.5 py-0.5 text-base tracking-[-0.04em] text-[#707070]"
                      style={geist}
                    >
                      <CopyIcon />
                      Copy
                    </span>
                  </div>

                  <BodyTabToggle tab={bodyTab} onTabChange={setBodyTab} />

                  <div
                    className="mt-10 text-sm font-medium leading-relaxed"
                    style={geist}
                  >
                    <AnimatePresence mode="wait">
                      {bodyTab === "pretty" ? (
                        <motion.div
                          key="pretty"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.22, ease: REVEAL_EASE }}
                        >
                          <JsonView data={LANDING_SAMPLE_RESPONSE} />
                        </motion.div>
                      ) : (
                        <motion.pre
                          key="raw"
                          className="m-0 whitespace-pre-wrap break-words text-[#737373]"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.22, ease: REVEAL_EASE }}
                        >
                          {JSON.stringify(LANDING_SAMPLE_RESPONSE, null, 2)}
                        </motion.pre>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <motion.div
                  className="mt-4 rounded-lg bg-[#f5f5f5] p-4"
                  variants={responseReveal}
                  custom={0.34}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <AiSparkleIcon />
                    <p
                      className="text-sm font-medium tracking-[-0.05em] text-[#282828]"
                      style={geist}
                    >
                      AI Explaination
                    </p>
                  </div>
                  <div className="space-y-2">
                    <ExplainInsightRow
                      label="Target users"
                      value={LANDING_EXPLAIN.who}
                    />
                    <ExplainInsightRow
                      label="Problems it solves"
                      value={LANDING_EXPLAIN.what}
                    />
                    <ExplainInsightRow
                      label="Build Idea"
                      value={LANDING_EXPLAIN.build}
                      highlight
                    />
                  </div>
                </motion.div>
              </motion.div>
              </motion.div>

              <motion.button
                type="button"
                onClick={onSend}
                className="mt-6 cursor-pointer self-center rounded-md bg-[#5b5bff] px-3 py-1.5 text-xs font-medium tracking-[-0.04em] text-white hover:bg-[#4f4fef] active:bg-[#4545e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bff]/45 focus-visible:ring-offset-2"
                style={geist}
                variants={responseReveal}
                custom={0.42}
                initial="hidden"
                animate="visible"
              >
                Test a real API
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function BodyTabToggle({
  tab,
  onTabChange,
}: {
  tab: "pretty" | "raw";
  onTabChange: (tab: "pretty" | "raw") => void;
}) {
  return (
    <div className="absolute right-3 top-3 flex items-center gap-2 rounded-xl bg-[#f2f2f2] p-1">
      <button
        type="button"
        onClick={() => onTabChange("pretty")}
        className={`px-1.5 py-1 text-sm font-medium tracking-[-0.05em] ${
          tab === "pretty"
            ? "rounded-lg bg-white text-[#222222]"
            : "rounded bg-transparent text-[#818181]"
        }`}
        style={geist}
      >
        Pretty
      </button>
      <button
        type="button"
        onClick={() => onTabChange("raw")}
        className={`px-1.5 py-1 text-sm font-medium tracking-[-0.04em] ${
          tab === "raw"
            ? "rounded-lg bg-white text-[#222222]"
            : "rounded bg-transparent text-[#818181]"
        }`}
        style={geist}
      >
        Raw
      </button>
    </div>
  );
}

function JsonView({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const indent = depth * 16;
  if (data === null) return <span className="text-[#FE7C0B]">null</span>;
  if (typeof data === "boolean")
    return <span className="text-[#FE7C0B]">{String(data)}</span>;
  if (typeof data === "number")
    return <span className="text-[#FE7C0B]">{data}</span>;
  if (typeof data === "string") {
    return (
      <span>
        <span className="text-[#9e9e9e]">&quot;</span>
        <span className="text-[#1BC95A]">{data}</span>
        <span className="text-[#9e9e9e]">&quot;</span>
      </span>
    );
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-[#9e9e9e]">[]</span>;
    return (
      <>
        <span className="text-[#9e9e9e]">[</span>
        {data.map((item, i) => (
          <div key={i} style={{ paddingLeft: indent + 16 }}>
            <JsonView data={item} depth={depth + 1} />
            {i < data.length - 1 && (
              <span className="text-[#9e9e9e]">,</span>
            )}
          </div>
        ))}
        <div style={{ paddingLeft: indent }}>
          <span className="text-[#9e9e9e]">]</span>
        </div>
      </>
    );
  }
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return <span className="text-[#9e9e9e]">{"{}"}</span>;
    return (
      <>
        <span className="text-[#9e9e9e]">{"{"}</span>
        {keys.map((key, i) => (
          <div key={key} style={{ paddingLeft: indent + 16 }}>
            <span className="text-[#9e9e9e]">&quot;</span>
            <span className="text-[#0396DC]">{key}</span>
            <span className="text-[#9e9e9e]">&quot;</span>
            <span className="text-[#9e9e9e]">: </span>
            <JsonView data={obj[key]} depth={depth + 1} />
            {i < keys.length - 1 && (
              <span className="text-[#9e9e9e]">,</span>
            )}
          </div>
        ))}
        <div style={{ paddingLeft: indent }}>
          <span className="text-[#9e9e9e]">{"}"}</span>
        </div>
      </>
    );
  }
  return <span className="text-[#9e9e9e]">{String(data)}</span>;
}

function ExplainInsightRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`h-[74px] w-full overflow-hidden rounded-lg border ${
        highlight
          ? "border-[#b6b6fe] bg-[#f0f0ff]"
          : "border-[#f2f2f2] bg-[#fafafa]"
      }`}
    >
      <div className="flex items-center gap-1 px-2 pt-2">
        {highlight ? <AiSparkleIcon /> : null}
        <p
          className={`text-sm font-medium tracking-[-0.05em] ${
            highlight ? "text-[#5b5bff]" : "text-[#585858]"
          }`}
          style={geist}
        >
          {label}
        </p>
      </div>
      {highlight ? (
        <p
          className="px-2 pt-1 text-sm font-normal leading-[1.43] tracking-[-0.04em] text-[#5b5bff]"
          style={geist}
        >
          {value}
        </p>
      ) : (
        <div className="mx-1 mt-1.5 h-9 overflow-hidden rounded-md bg-[#f0f0f0] px-2 py-1.5">
          <p
            className="text-sm font-normal leading-[1.43] tracking-[-0.04em] text-[#6a6767]"
            style={geist}
          >
            {value}
          </p>
        </div>
      )}
    </div>
  );
}

function AiSparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        transform="translate(0.6654 0.4983)"
        d="M13.751 7.179c-2.906-.75-5.178-3.021-5.927-5.928l-.323-1.251-.322 1.251c-.75 2.907-3.021 5.178-5.928 5.928l-1.251 .322 1.251 .324c2.907 .749 5.178 3.02 5.928 5.926l.322 1.252 .323-1.252c.749-2.906 3.021-5.177 5.927-5.926l1.252-.324z"
        fill="#5b5bff"
        fillRule="evenodd"
      />
      <path
        transform="translate(11.0021 1.8333)"
        d="M1.665 3.331c0-.774 .85-1.666 1.666-1.666-.786 0-1.666-.9-1.666-1.665 0 .765-.872 1.665-1.665 1.665 .763 0 1.665 .887 1.665 1.666z"
        fill="#5b5bff"
        fillRule="evenodd"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="5.33"
        y="5.33"
        width="9.33"
        height="9.33"
        rx="1.5"
        stroke="#707070"
        strokeWidth="1.4"
      />
      <rect
        x="1.33"
        y="1.33"
        width="9.33"
        height="9.33"
        rx="1.5"
        stroke="#707070"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function SendArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.5 8h9M8.5 4.5L12 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
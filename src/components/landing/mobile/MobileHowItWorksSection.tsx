"use client";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const STEP_TWO_SAMPLE_RESPONSE = {
  status: "ok",
  node_id: "node_8f3a1c",
  network: "ethereum-mainnet",
  block_height: 20481923,
  latency_ms: 142,
  uptime: "99.98%",
} as const;

export default function MobileHowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="mobile-how-it-works-heading"
      className="mt-20 px-4 lg:hidden"
    >
      <h2
        id="mobile-how-it-works-heading"
        className="max-w-[263px] text-base font-semibold tracking-[-0.05em] text-[#3d3d3d]"
        style={geist}
      >
        From unknown endpoint to a decision in three steps
      </h2>

      <div className="mt-4 flex flex-col gap-4">
        <MobileHowItWorksStepOne />
        <MobileHowItWorksStepTwo />
        <MobileHowItWorksStepThree />
      </div>
    </section>
  );
}

function MobileHowItWorksStepOne() {
  return (
    <article className="relative h-[423px] w-full overflow-hidden rounded-xl border border-[#f2f2f2] bg-white">
      <div className="absolute left-3 right-3 top-[82px] h-[52px] overflow-hidden rounded-lg border border-[#f2f2f2] bg-white">
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
          <MethodChevronIcon />
        </div>
        <p
          className="absolute left-1/2 top-[17px] -translate-x-1/2 text-sm font-normal tracking-[-0.04em] text-[#9e9e9e]"
          style={geist}
        >
          Paste an API endpoint...
        </p>
      </div>

      <div className="absolute left-3 right-3 top-[146px] h-[158px] overflow-hidden rounded-md border border-[#f2f2f2] bg-[#fafafa] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium tracking-[-0.05em] text-[#585858]"
              style={geist}
            >
              Headers
            </span>
            <HeaderInfoIcon />
          </div>
          <span
            className="text-xs font-normal tracking-[-0.04em] text-[#5b5bff]"
            style={geist}
          >
            Add header
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#f2f2f2] bg-[#fafafa] px-3 py-3 text-xs tracking-[-0.04em] text-[#5b5bff]">
            Authorization
          </div>
          <div
            className="rounded-lg border border-[#f2f2f2] bg-white px-3 py-3 text-xs tracking-[-0.04em] text-[#9e9e9e]"
            style={geist}
          >
            Bearer SK-____
          </div>
          <div
            className="rounded-lg border border-[#f2f2f2] bg-white px-3 py-3 text-xs tracking-[-0.04em] text-[#9e9e9e]"
            style={geist}
          >
            Key
          </div>
          <div
            className="rounded-lg border border-[#f2f2f2] bg-white px-3 py-3 text-xs tracking-[-0.04em] text-[#9e9e9e]"
            style={geist}
          >
            Value
          </div>
        </div>
      </div>

      <span className="absolute left-3 top-[336px] inline-flex rounded-md bg-[#f0f0ff] px-1.5 py-0.5 text-xs font-medium tracking-[-0.04em] text-[#5b5bff]">
        Step 1
      </span>
      <h3
        className="absolute left-3 top-[366px] text-base font-semibold tracking-[-0.05em] text-[#585858]"
        style={geist}
      >
        Paste or pick
      </h3>
      <p
        className="absolute left-3 right-3 top-[395px] text-xs font-normal tracking-[-0.035em] text-[#707070]"
        style={geist}
      >
        Drop in any endpoint, or chose one from Discover
      </p>
    </article>
  );
}

function MobileHowItWorksStepTwo() {
  return (
    <article className="w-full min-h-[423px] overflow-hidden rounded-xl border border-[#f2f2f2] bg-white">
      <div className="relative mx-3 mt-3 h-[294px] overflow-hidden rounded-lg bg-[#fafafa]">
        <span
          className="absolute left-3 top-3 text-sm font-medium tracking-[-0.04em] text-[#9e9e9e]"
          style={geist}
        >
          Body
        </span>

        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-xl bg-[#f2f2f2] p-1">
          <span
            className="rounded-lg bg-white px-1.5 py-1 text-sm font-medium tracking-[-0.05em] text-[#222222]"
            style={geist}
          >
            Pretty
          </span>
          <span
            className="rounded-lg px-1.5 py-1 text-sm font-medium tracking-[-0.05em] text-[#818181]"
            style={geist}
          >
            Raw
          </span>
        </div>

        <div
          className="absolute bottom-7 left-3 right-3 top-[46px] overflow-hidden text-sm font-medium leading-7 tracking-[-0.04em]"
          style={geist}
        >
          <LandingJsonView data={STEP_TWO_SAMPLE_RESPONSE} rowGapClass="mb-[14px]" />
        </div>
      </div>

      <div className="px-3 pb-4 pt-6">
        <span className="inline-flex rounded-md bg-[#f0f0ff] px-1.5 py-0.5 text-xs font-medium tracking-[-0.04em] text-[#5b5bff]">
          Step 2
        </span>
        <h3
          className="mt-2 text-base font-semibold tracking-[-0.05em] text-[#585858]"
          style={geist}
        >
          Send it
        </h3>
        <p
          className="mt-1 text-xs font-normal leading-snug tracking-[-0.035em] text-[#707070]"
          style={geist}
        >
          See the real response, status and headers, like any API client
        </p>
      </div>
    </article>
  );
}

function MobileHowItWorksStepThree() {
  return (
    <article className="w-full min-h-[423px] overflow-hidden rounded-xl border border-[#f2f2f2] bg-white">
      <div className="relative mx-3 mt-[76px] h-[178px] overflow-hidden rounded-lg bg-[#fafafa] p-3">
        <div className="flex items-start justify-between gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/explain-avatar.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-lg object-cover"
            draggable={false}
          />
          <span
            className="shrink-0 rounded-md bg-[#5b5bff] px-1.5 py-1.5 text-xs font-normal tracking-[-0.04em] text-white"
            style={geist}
          >
            Analyze now
          </span>
        </div>

        <p
          className="mt-3 text-sm font-medium tracking-[-0.035em] text-[#585858]"
          style={geist}
        >
          There&apos;s more to this response
        </p>
        <p
          className="mt-1.5 max-w-[295px] text-xs font-normal leading-[1.67] tracking-[-0.04em] text-[#939393]"
          style={geist}
        >
          This response came back in 142ms. See who it&apos;s for, what it does,
          and an idea for something you could build with it
        </p>
        <span
          className="mt-4 inline-flex rounded-md bg-white px-1.5 py-1.5 text-xs font-medium tracking-[-0.04em] text-[#5c5c5c]"
          style={geist}
        >
          Skip for now
        </span>
      </div>

      <div className="px-3 pb-4 pt-6">
        <span className="inline-flex rounded-md bg-[#f0f0ff] px-1.5 py-0.5 text-xs font-medium tracking-[-0.04em] text-[#5b5bff]">
          Step 3
        </span>
        <h3
          className="mt-2 text-base font-semibold tracking-[-0.05em] text-[#585858]"
          style={geist}
        >
          Read what it means
        </h3>
        <p
          className="mt-1 text-xs font-normal leading-snug tracking-[-0.035em] text-[#707070]"
          style={geist}
        >
          Fix the errors in one click, or open the explanation and see what you
          could build
        </p>
      </div>
    </article>
  );
}

/** Same token colors as Try it right here `JsonView` (desktop). */
function LandingJsonView({
  data,
  depth = 0,
  rowGapClass,
}: {
  data: unknown;
  depth?: number;
  rowGapClass?: string;
}) {
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
          <div
            key={i}
            className={rowGapClass}
            style={{ paddingLeft: indent + 16 }}
          >
            <LandingJsonView data={item} depth={depth + 1} rowGapClass={rowGapClass} />
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
          <div
            key={key}
            className={rowGapClass}
            style={{ paddingLeft: indent + 16 }}
          >
            <span className="text-[#9e9e9e]">&quot;</span>
            <span className="text-[#0396DC]">{key}</span>
            <span className="text-[#9e9e9e]">&quot;</span>
            <span className="text-[#9e9e9e]">: </span>
            <LandingJsonView
              data={obj[key]}
              depth={depth + 1}
              rowGapClass={rowGapClass}
            />
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

function MethodChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 6l4 4 4-4"
        stroke="#5a5a5a"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeaderInfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.67" stroke="#9e9e9e" strokeWidth="1.4" />
      <path
        d="M8 7v4M8 5v.01"
        stroke="#9e9e9e"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
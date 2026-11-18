"use client";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const STEPS = [
  {
    src: "/landing/OebTN.png",
    alt: "Step 2: Send the request and view the response",
    label: "Step 2",
    title: "Send it",
    body: "See the real response, status and headers, like any API client",
  },
  {
    src: "/landing/vxcEL.png",
    alt: "Step 3: Read what the response means",
    label: "Step 3",
    title: "Understand it",
    body: "Get plain-language explainers and a build idea from the body",
  },
] as const;

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
        {STEPS.map((step) => (
          <article
            key={step.src}
            className="overflow-hidden rounded-xl border border-[#f2f2f2] bg-white"
          >
            <div className="overflow-hidden bg-white px-3 pt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.src}
                alt={step.alt}
                className="h-auto w-full rounded-lg"
                draggable={false}
              />
            </div>
            <div className="px-3 pb-4 pt-3">
              <span className="inline-flex rounded-md bg-[#f0f0ff] px-1.5 py-0.5 text-xs font-medium tracking-[-0.04em] text-[#5b5bff]">
                {step.label}
              </span>
              <h3
                className="mt-2 text-base font-semibold tracking-[-0.05em] text-[#585858]"
                style={geist}
              >
                {step.title}
              </h3>
              <p
                className="mt-1 text-xs font-normal tracking-[-0.035em] text-[#707070]"
                style={geist}
              >
                {step.body}
              </p>
            </div>
          </article>
        ))}
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
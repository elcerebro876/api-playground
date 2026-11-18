"use client";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const STEPS = [
  {
    src: "/landing/MnrrP.png",
    alt: "Step 1: Paste or pick an API endpoint",
    label: "Step 1",
    title: "Paste or pick",
    body: "Drop in any endpoint, or chose one from Discover",
  },
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
              <span className="inline-flex rounded-md bg-[#f0f0ff] px-1.5 py-0.5 text-xs font-medium text-[#5b5bff]">
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

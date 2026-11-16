"use client";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const HOW_IT_WORKS_STEPS = [
  {
    src: "/landing/MnrrP.png",
    width: 347,
    height: 439,
    alt: "Step 1: Paste or pick an API endpoint",
  },
  {
    src: "/landing/OebTN.png",
    width: 346,
    height: 439,
    alt: "Step 2: Send the request and view the response",
  },
  {
    src: "/landing/vxcEL.png",
    width: 347,
    height: 439,
    alt: "Step 3: Read what the response means",
  },
] as const;

export default function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="hidden lg:block lg:mt-[140px]"
    >
      <h2
        id="how-it-works-heading"
        className="max-w-[339px] text-2xl font-semibold leading-normal tracking-[-0.05em] text-[#3d3d3d]"
        style={geist}
      >
        From unknown endpoint to a decision in three steps
      </h2>
      <div className="mt-6 flex items-start gap-4">
        {HOW_IT_WORKS_STEPS.map((step) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={step.src}
            src={step.src}
            alt={step.alt}
            width={step.width}
            height={step.height}
            className="shrink-0"
            draggable={false}
          />
        ))}
      </div>
    </section>
  );
}
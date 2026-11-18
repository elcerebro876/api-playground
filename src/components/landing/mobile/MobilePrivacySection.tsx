"use client";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const PRIVACY_POINTS = [
  {
    title: "Secrets are masked",
    body: "Secret aren\u2019t sent for analysis",
  },
  {
    title: "Postman imports stay local",
    body: "The file is real in your browser. Nothing is uploaded",
  },
  {
    title: "Analytics skip the sensitive parts",
    body: "No request bodies. API key or private response data",
  },
] as const;

export default function MobilePrivacySection() {
  return (
    <section
      id="privacy"
      aria-labelledby="mobile-privacy-heading"
      className="mt-20 px-4 lg:hidden"
    >
      <div className="rounded-xl bg-[#222222] p-3">
        <h2
          id="mobile-privacy-heading"
          className="text-base font-semibold tracking-[-0.05em] text-white"
          style={geist}
        >
          Safe to paste into
        </h2>
        <p
          className="mt-2 text-xs font-normal tracking-[-0.035em] text-[#f7f7f7]"
          style={geist}
        >
          You are going to paste real endpoints and keys. Playground is built for
          that
        </p>

        <div className="mt-4 rounded-lg border border-[#3d3d3d] bg-[#222222] px-3 py-3">
          {PRIVACY_POINTS.map((point, index) => (
            <div key={point.title}>
              <h3
                className="text-sm font-semibold tracking-[-0.05em] text-white"
                style={geist}
              >
                {point.title}
              </h3>
              <p
                className="mt-1 text-xs font-normal tracking-[-0.035em] text-[#f7f7f7]"
                style={geist}
              >
                {point.body}
              </p>
              {index < PRIVACY_POINTS.length - 1 ? (
                <hr className="my-4 border-[#424242]" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
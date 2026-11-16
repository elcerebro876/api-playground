"use client";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const PRIVACY_POINTS = [
  {
    title: "Secrets are masked",
    body: "Secret aren\u2019t sent for analysis",
  },
  {
    title: "Postman imports stay local",
    body: "The file is  read in your browser. Nothing is uploaded",
  },
  {
    title: "Analytics skip the sensitive parts",
    body: "No request bodies, API keys or private response data",
  },
] as const;

export default function PrivacySection() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="hidden lg:mt-[132px] lg:block"
    >
      <div className="h-[256px] w-full rounded-xl bg-[#222222] px-8 py-8">
        <div className="flex items-start gap-[210px]">
          <div className="w-[339px] shrink-0">
            <h2
              id="privacy-heading"
              className="text-[32px] font-semibold leading-none tracking-[-0.05em] text-white"
              style={geist}
            >
              Safe to paste into
            </h2>
            <p
              className="mt-[18px] max-w-[320px] text-sm font-normal leading-normal tracking-[-0.035em] text-[#f7f7f7]"
              style={geist}
            >
              You are going to paste real endpoints and keys. Playground is built
              for that
            </p>
          </div>
          <div className="min-w-0 w-[440px] pt-[5px]">
            {PRIVACY_POINTS.map((point, index) => (
              <div key={point.title}>
                <h3
                  className="text-base font-semibold leading-[21px] tracking-[-0.05em] text-white"
                  style={geist}
                >
                  {point.title}
                </h3>
                <p
                  className="mt-[4px] text-xs font-normal leading-4 tracking-[-0.035em] text-[#f7f7f7]"
                  style={geist}
                >
                  {point.body}
                </p>
                {index < PRIVACY_POINTS.length - 1 ? (
                  <div
                    className="my-4 h-px w-full bg-[#424242]"
                    aria-hidden
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
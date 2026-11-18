"use client";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const MOBILE_FEATURES = [
  {
    title: "Error that coaches you",
    body: "A 404 or a bad header gets a plain-English cause and a one-click fix you can apply before sending again.",
    demo: "error" as const,
  },
  {
    title: "Responses that explain themselves",
    body: "Who the API is for, what it does, and a build idea, so a JSON blob turns into a decision",
    demo: "explain" as const,
  },
  {
    title: "Curated API to start from",
    body: "Pick an API from Discover, prefill an example, and run it. Auth needs are labelled up front.",
    demo: "discover" as const,
  },
  {
    title: "Bring your collection",
    body: "Import a postman collection and try the explainer on APIs you already use.",
    demo: "import" as const,
  },
] as const;

export default function MobileWhatItDoesSection() {
  return (
    <section
      id="what-it-does"
      aria-labelledby="mobile-what-it-does-heading"
      className="mt-20 lg:hidden"
    >
      <h2
        id="mobile-what-it-does-heading"
        className="px-4 text-center text-base font-semibold tracking-[-0.05em] text-[#3d3d3d]"
        style={geist}
      >
        Postman sends the request, Playground tells you what happened
      </h2>
      <p
        className="mx-auto mt-2 max-w-[292px] px-4 text-center text-xs font-normal tracking-[-0.035em] text-[#707070]"
        style={geist}
      >
        Raw responses are easy to get and hard to read. Playground adds the part
        that comes after.
      </p>

      <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MOBILE_FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="w-[343px] shrink-0 snap-center rounded-xl border border-[#f2f2f2] bg-white p-3"
          >
            <div className="h-[316px] overflow-hidden rounded-lg bg-[#fafafa]">
              {feature.demo === "error" ? (
                <MobileErrorDemo />
              ) : feature.demo === "explain" ? (
                <MobileExplainDemo />
              ) : feature.demo === "discover" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/landing/discover-curated.png"
                  alt=""
                  className="size-full object-cover object-top"
                  draggable={false}
                />
              ) : (
                <MobileImportDemo />
              )}
            </div>
            <h3
              className="mt-3 text-sm font-semibold tracking-[-0.05em] text-[#585858]"
              style={geist}
            >
              {feature.title}
            </h3>
            <p
              className="mt-1 text-xs font-normal leading-relaxed tracking-[-0.035em] text-[#707070]"
              style={geist}
            >
              {feature.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MobileErrorDemo() {
  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-xs font-medium tracking-[-0.05em] text-[#585858]"
          style={geist}
        >
          PUT request. api.example/v1/charges
        </p>
        <span className="shrink-0 rounded-md bg-[#ffdada] px-2 py-1 text-xs text-[#c70000]">
          401
        </span>
      </div>
      <div className="mt-3 rounded-md bg-white p-3 text-xs tracking-[-0.05em] text-[#585858]">
        {`{“error”: “invalid_api_key”, “message”: “no valid API key provided”}`}
      </div>
      <div className="mt-3 flex-1 rounded-md border border-[#f2f2f2] bg-white p-3">
        <p className="text-xs font-medium text-[#585858]">Wrong auth scheme</p>
        <p className="mt-2 text-xs leading-5 text-[#939393]">
          This API expects an x-api key header, not a bearer token.
        </p>
        <span className="mt-3 inline-flex rounded-md bg-white px-2 py-1.5 text-xs text-[#5b5bff]">
          Fix header
        </span>
      </div>
    </div>
  );
}

function MobileExplainDemo() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <p className="text-xs font-medium text-[#282828]">AI Explaination</p>
      {[
        "Target users",
        "Problems it solves",
        "Build Idea",
      ].map((label) => (
        <div
          key={label}
          className={`rounded-lg border p-2 text-xs ${
            label === "Build Idea"
              ? "border-[#b6b6fe] bg-[#f0f0ff] text-[#5b5bff]"
              : "border-[#f2f2f2] bg-[#fafafa] text-[#6a6767]"
          }`}
        >
          <span className="font-medium text-[#585858]">{label}</span>
        </div>
      ))}
    </div>
  );
}

function MobileImportDemo() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 p-4 text-center">
      <p className="text-xs font-medium text-[#585858]">Postman collection</p>
      <p className="text-xs text-[#707070]">
        Import a .json collection and run requests with explainers.
      </p>
    </div>
  );
}

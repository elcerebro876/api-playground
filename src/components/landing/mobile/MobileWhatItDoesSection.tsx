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
    body: "Who the API is for, What it does, and a build idea, So a JSON blob turns into a decision",
    demo: "explain" as const,
  },
  {
    title: "Curated API to start from",
    body: "Pick an API from Discover prefill an example, and run it. Auth needs are labelled up front.",
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
                <MobileDiscoverDemo />
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
    <div className="relative size-full bg-[#fafafa]">
      <p
        className="absolute left-3 top-4 max-w-[220px] text-xs font-medium tracking-[-0.05em] text-[#585858]"
        style={geist}
      >
        PUT request. api.example/v1/charges
      </p>
      <span
        className="absolute right-3 top-3 rounded-md bg-[#ffdada] px-2 py-1 text-xs font-normal tracking-[-0.04em] text-[#c70000]"
        style={geist}
      >
        200
      </span>

      <div className="absolute left-3 right-3 top-[46px] flex h-14 items-start overflow-hidden rounded-md bg-white px-3 py-3">
        <p
          className="text-xs font-normal leading-normal tracking-[-0.05em] text-[#585858]"
          style={geist}
        >
          {`{“error”: “invalid_api_key, “message”: “no  valid API key provided”}`}
        </p>
      </div>

      <div className="absolute left-3 right-3 top-[114px] h-[190px] overflow-hidden rounded-md border border-[#f2f2f2] bg-white">
        <div className="flex items-center gap-2 px-3 pt-3">
          <span
            className="text-xs font-normal tracking-[-0.05em] text-[#585858]"
            style={geist}
          >
            Authorization
          </span>
          <span
            className="rounded bg-[#ffd6d6] px-2 py-0.5 text-xs font-normal leading-[1.67] tracking-[-0.04em] text-[#ff1616]"
            style={geist}
          >
            Bearer sk_live_4f8a2c9d1e7b6f30
          </span>
        </div>

        <div className="mx-1 mt-3 h-[142px] overflow-hidden rounded bg-[#f7f7f7]">
          <div className="flex items-center gap-2 px-3 pt-3">
            <CoachLightbulbIcon />
            <p
              className="text-xs font-medium tracking-[-0.05em] text-[#585858]"
              style={geist}
            >
              Wrong auth scheme
            </p>
          </div>
          <p
            className="px-3 pt-1 text-xs font-normal leading-[1.67] tracking-[-0.04em] text-[#939393]"
            style={geist}
          >
            This API expects an x-api key header, not a bearer token. The key
            itself looks valid- its just in the wrong place
          </p>
          <span
            className="mx-3 mt-4 inline-flex rounded-md bg-white px-2 py-1.5 text-xs font-normal tracking-[-0.04em] text-[#5b5bff]"
            style={geist}
          >
            Fix header
          </span>
        </div>
      </div>
    </div>
  );
}

function CoachLightbulbIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M9 12c0.2-1 0.7-1.7 1.5-2.5 1-0.9 1.5-2.2 1.5-3.5 0-1.5913-0.63214-3.11742-1.75736-4.24264-1.12522-1.12522-2.65134-1.75736-4.24264-1.75736-1.5913 0-3.11742 0.63214-4.24264 1.75736-1.12522 1.12522-1.75736 2.65134-1.75736 4.24264 0 1 0.2 2.2 1.5 3.5 0.7 0.7 1.3 1.5 1.5 2.5"
        stroke="#5b5bff"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        transform="translate(4.5 1.5)"
      />
      <path
        d="M0 0h4.5"
        stroke="#5b5bff"
        strokeWidth="1.4"
        strokeLinecap="round"
        transform="translate(6.75 13.5)"
      />
      <path
        d="M0 0h3"
        stroke="#5b5bff"
        strokeWidth="1.4"
        strokeLinecap="round"
        transform="translate(7.5 16.5)"
      />
    </svg>
  );
}

function MobileExplainDemo() {
  return (
    <div className="relative size-full bg-[#fafafa]">
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <AiSparkleIcon />
        <p
          className="text-sm font-medium tracking-[-0.05em] text-[#282828]"
          style={geist}
        >
          AI Explaination
        </p>
      </div>

      <div className="absolute left-3 right-3 top-[38px] h-[94px] overflow-hidden rounded-lg border border-[#f2f2f2] bg-[#fafafa]">
        <p
          className="px-2 pt-2 text-sm font-medium tracking-[-0.05em] text-[#585858]"
          style={geist}
        >
          Target users
        </p>
        <div className="mx-1 mt-1.5 h-14 overflow-hidden rounded-md bg-[#f0f0f0] px-2 py-2">
          <p
            className="text-xs font-normal leading-[1.67] tracking-[-0.04em] text-[#6a6767]"
            style={geist}
          >
            Infra teams monitoring node uptime and network health
          </p>
        </div>
      </div>

      <div className="absolute left-3 right-3 top-[144px] h-[94px] overflow-hidden rounded-lg border border-[#f2f2f2] bg-[#fafafa]">
        <p
          className="px-2 pt-2 text-sm font-medium tracking-[-0.05em] text-[#585858]"
          style={geist}
        >
          Problems it solves
        </p>
        <div className="mx-1 mt-1.5 h-14 overflow-hidden rounded-md bg-[#f0f0f0] px-2 py-2">
          <p
            className="text-xs font-normal leading-[1.67] tracking-[-0.04em] text-[#6a6767]"
            style={geist}
          >
            Skip building your own health-check polling from scratch
          </p>
        </div>
      </div>

      <div className="absolute left-3 right-3 top-[250px] h-[82px] overflow-hidden rounded-lg border border-[#b6b6fe] bg-[#f0f0ff]">
        <div className="flex items-center gap-1 px-2 pt-2">
          <AiSparkleIcon />
          <p
            className="text-sm font-medium tracking-[-0.05em] text-[#5b5bff]"
            style={geist}
          >
            Build Idea
          </p>
        </div>
        <p
          className="px-2 pt-1 text-sm font-normal leading-[1.43] tracking-[-0.04em] text-[#5b5bff]"
          style={geist}
        >
          A status dashboard that alerts you when uptime drops below a threshold
        </p>
      </div>
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

function MobileDiscoverDemo() {
  return (
    <div className="relative size-full overflow-hidden rounded-lg bg-[#f0f0ff]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/discover-curated.png"
        alt=""
        width={175}
        height={174}
        className="absolute left-[72px] top-[69px] h-[174px] w-[175px] object-cover"
        draggable={false}
      />
    </div>
  );
}

function MobileImportDemo() {
  return (
    <div className="relative size-full overflow-hidden bg-[#fafafa] p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white">
          <FolderGlyphIcon className="h-[18px] w-[18px]" color="#595959" />
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-medium tracking-[-0.035em] text-[#595959]"
            style={geist}
          >
            Postman collection
          </p>
          <p
            className="mt-1 text-xs leading-[1.67] tracking-[-0.04em] text-[#7a7a7a]"
            style={geist}
          >
            Collection v2.1 (json). it reads in your browser
          </p>
        </div>
      </div>

      <div className="relative mt-[18px] h-[213px] overflow-hidden rounded-md bg-white">
        <div className="px-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-xs font-medium tracking-[-0.05em] text-[#585858]"
              style={geist}
            >
              Folders
            </p>
            <div
              className="flex shrink-0 items-center gap-2 text-xs font-medium tracking-[-0.05em]"
              style={geist}
            >
              <span className="text-[#585858]">7 of 10 used</span>
              <span className="text-[#7a7a7a]">3 free</span>
            </div>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-sm bg-[#cbcbff]">
            <div className="h-full w-[86.7%] rounded-sm bg-[#9b9bff]" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p
              className="text-xs font-medium tracking-[-0.05em] text-[#585858]"
              style={geist}
            >
              Endpoints
            </p>
            <div
              className="flex shrink-0 items-center gap-2 text-xs font-medium tracking-[-0.05em]"
              style={geist}
            >
              <span className="text-[#585858]">61 of 100 used</span>
              <span className="text-[#7a7a7a]">39 free</span>
            </div>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-sm bg-[#cbcbff]">
            <div className="h-full w-[76%] rounded-sm bg-[#9b9bff]" />
          </div>
        </div>

        <div className="absolute left-3 right-3 top-[92px] overflow-hidden rounded-lg border-[0.6px] border-[#ffdaae] bg-[#fffdfa]">
          <div className="flex items-start gap-1 px-2 pt-2">
            <WarningSparkleIcon />
            <p
              className="text-xs font-medium leading-tight tracking-[-0.05em] text-[#dd7800]"
              style={geist}
            >
              You collection is bigger than the space you have
            </p>
          </div>
          <div className="mx-1 mb-1 mt-2 rounded-md bg-[#fff3e0] px-2 py-2">
            <p
              className="text-xs font-normal leading-[1.67] tracking-[-0.04em] text-[#a95c00]"
              style={geist}
            >
              It has 240 request in 14 folders. Pick the folders to import now
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderGlyphIcon({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        transform="translate(2.2499 2.2501)"
        d="M19.869 13.482q0 1.456-.427 2.636-.434 1.198-1.28 2.044-.846 .846-2.044 1.28-1.18 .427-2.636 .427h-7.782q-1.459 0-2.642-.427-1.2-.433-2.048-1.279-.847-.846-1.282-2.044-.428-1.181-.428-2.637v-7.8q0-1.462 .283-2.569 .311-1.216 .974-2.048 1.406-1.765 4.336-1.765h2q.705 .001 1.333 .315 .63 .315 1.052 .879l.911 1.212q.225 .299 .56 .466 .334 .167 .708 .168h2.829q1.461 0 2.52 .384 1.105 .402 1.813 1.231 .678 .794 .992 1.988 .286 1.086 .286 2.574l-.028 4.969zM18.469 13.478l.028-4.961q0-1.306-.24-2.218-.233-.885-.703-1.435-.468-.548-1.226-.824-.827-.3-2.042-.3h-2.831q-.703-.001-1.332-.316-.629-.314-1.052-.876l-.915-1.216q-.223-.298-.556-.465-.334-.166-.707-.167h-2q-1.186 0-2.012 .334-.752 .305-1.229 .903-.952 1.195-.952 3.745v7.8q0 1.21 .344 2.159 .328 .905 .955 1.531 .628 .626 1.535 .953 .952 .344 2.166 .344h7.782q1.21 0 2.16-.344 .905-.327 1.53-.953 .626-.625 .953-1.53 .344-.95 .344-2.16z"
        fill={color}
      />
      <path
        transform="translate(7.481 14.463)"
        d="M0-.7h8.735q.139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268 0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053h-8.735q-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268 0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053z"
        fill={color}
      />
    </svg>
  );
}

function WarningSparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="mt-0.5 shrink-0"
      aria-hidden
    >
      <path
        transform="translate(0.6654 0.4983)"
        d="M13.751 7.179c-2.906-.75-5.178-3.021-5.927-5.928l-.323-1.251-.322 1.251c-.75 2.907-3.021 5.178-5.928 5.928l-1.251 .322 1.251 .324c2.907 .749 5.178 3.02 5.928 5.926l.322 1.252 .323-1.252c.749-2.906 3.021-5.177 5.927-5.926l1.252-.324z"
        fill="#dd7800"
        fillRule="evenodd"
      />
      <path
        transform="translate(11.0021 1.8333)"
        d="M1.665 3.331c0-.774 .85-1.666 1.666-1.666-.786 0-1.666-.9-1.666-1.665 0 .765-.872 1.665-1.665 1.665 .763 0 1.665 .887 1.665 1.666z"
        fill="#dd7800"
        fillRule="evenodd"
      />
    </svg>
  );
}

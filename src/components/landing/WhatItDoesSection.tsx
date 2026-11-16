"use client";

import { useEffect, useRef, useState } from "react";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const FEATURE_IDS = ["alert", "spark", "sliders", "folder"] as const;

type FeatureId = (typeof FEATURE_IDS)[number];

const WHAT_IT_DOES_SECTIONS: {
  id: FeatureId;
  cardTitle: string;
  cardBody: string;
}[] = [
  {
    id: "alert",
    cardTitle: "Error that coaches you",
    cardBody:
      "A 404 or a bad header gets a plain-English cause and a one-click fix you can apply before sending again.",
  },
  {
    id: "spark",
    cardTitle: "Responses that explain themselves",
    cardBody:
      "Who the API is for, what it does, and a build idea, so a JSON blob turns into a decision",
  },
  {
    id: "sliders",
    cardTitle: "Curated API to start from",
    cardBody:
      "Pick an API from Discover, prefill an example, and run it. Auth needs are labelled up front.",
  },
  {
    id: "folder",
    cardTitle: "Bring your collection",
    cardBody:
      "Import a postman collection and try the explainer on APIs you already use.",
  },
];

const STEP_COUNT = WHAT_IT_DOES_SECTIONS.length;

/** Keep the section centered in the viewport, but never under the navbar. */
function getStickyTop(sticky: HTMLElement) {
  const header = document.querySelector<HTMLElement>("[data-landing-header]");
  const headerHeight = header?.offsetHeight ?? 0;
  return Math.max(headerHeight, (window.innerHeight - sticky.offsetHeight) / 2);
}

export default function WhatItDoesSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateActiveStep = () => {
      const section = sectionRef.current;
      if (!section) return;

      const sticky = section.querySelector<HTMLElement>(
        "[data-what-it-does-sticky]",
      );
      if (!sticky) return;

      const stickyTop = getStickyTop(sticky);
      sticky.style.top = `${stickyTop}px`;

      // The section pauses until this scroll track runs out.
      const scrollTrack = section.offsetHeight - sticky.offsetHeight;
      if (scrollTrack <= 0) return;

      const pinnedDistance = stickyTop - section.getBoundingClientRect().top;
      const progress = Math.min(
        1,
        Math.max(0, pinnedDistance / scrollTrack),
      );
      const step = Math.min(
        STEP_COUNT - 1,
        Math.floor(progress * STEP_COUNT),
      );
      setActiveStep(step);
    };

    updateActiveStep();
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    window.addEventListener("resize", updateActiveStep);
    return () => {
      window.removeEventListener("scroll", updateActiveStep);
      window.removeEventListener("resize", updateActiveStep);
    };
  }, []);

  const section = WHAT_IT_DOES_SECTIONS[activeStep] ?? WHAT_IT_DOES_SECTIONS[0];

  const goToFeature = (index: number) => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const sticky = sectionEl.querySelector<HTMLElement>(
      "[data-what-it-does-sticky]",
    );
    if (!sticky) return;

    const stickyTop = getStickyTop(sticky);
    sticky.style.top = `${stickyTop}px`;
    setActiveStep(index);

    const sectionTop = sectionEl.getBoundingClientRect().top + window.scrollY;
    const scrollTrack = sectionEl.offsetHeight - sticky.offsetHeight;
    // Land in the middle of the clicked feature's slice of the scroll track.
    const progress = (index + 0.5) / STEP_COUNT;
    const target =
      scrollTrack > 0
        ? sectionTop - stickyTop + progress * scrollTrack
        : sectionTop - stickyTop;

    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="what-it-does-heading"
      className="hidden lg:block lg:mt-[140px] lg:h-[max(120vh,900px)]"
    >
      <div
        data-what-it-does-sticky
        className="sticky z-10 flex flex-col justify-start bg-white pb-10"
      >
        <h2
          id="what-it-does-heading"
          className="mx-auto max-w-[394px] text-center text-2xl font-semibold leading-normal tracking-[-0.05em] text-[#3d3d3d]"
          style={geist}
        >
          Postman sends the request, Playground tells you what happened
        </h2>
        <p
          className="mx-auto mt-2 max-w-[386px] text-center text-base font-normal tracking-[-0.035em] text-[#707070]"
          style={geist}
        >
          Raw responses are easy to get and hard to read. Playground adds the part
          that comes after.
        </p>
        <div
          data-what-it-does-demo
          className="mx-auto mt-[46px] flex items-start justify-center gap-6"
        >
          <div className="flex flex-col gap-4 pt-12">
            {WHAT_IT_DOES_SECTIONS.map((item, index) => (
              <FeatureIconButton
                key={item.id}
                active={index === activeStep}
                kind={item.id}
                label={item.cardTitle}
                onClick={() => goToFeature(index)}
              />
            ))}
          </div>
          <WhatItDoesDemoCard
            title={section.cardTitle}
            description={section.cardBody}
            stepIndex={activeStep}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureIconButton({
  active,
  kind,
  label,
  onClick,
}: {
  active: boolean;
  kind: FeatureId;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex size-12 cursor-pointer items-center justify-center rounded-xl ${
        active ? "bg-[#5b5bff]" : "border border-[#f2f2f2] bg-white"
      }`}
    >
      <FeatureIcon kind={kind} active={active} />
    </button>
  );
}

function FeatureIcon({ kind, active }: { kind: FeatureId; active: boolean }) {
  const stroke = active ? "#ffffff" : "#707070";
  if (kind === "alert") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M1.86093 6.61521c-0.14596-0.65747-0.12355-1.34116 0.06516-1.98766 0.1887-0.6465 0.53759-1.23489 1.01431-1.71061 0.47672-0.47572 1.06584-0.82338 1.71274-1.01073 0.6469-0.18735 1.33063-0.20833 1.98779-0.061 0.36171-0.5657 0.86-1.03124 1.44896-1.35371 0.58895-0.32247 1.2496-0.4915 1.92105-0.4915 0.67145 0 1.3321 0.16903 1.92104 0.4915 0.58895 0.32247 1.08724 0.78802 1.44895 1.35371 0.65817-0.14798 1.34307-0.12709 1.991 0.06072 0.64793 0.1878 1.23783 0.53643 1.71485 1.01344 0.47701 0.47701 0.82564 1.06692 1.01344 1.71485 0.18781 0.64793 0.20869 1.33283 0.06071 1.99099 0.5657 0.36171 1.03124 0.86 1.35372 1.44896 0.32247 0.58895 0.4915 1.2496 0.4915 1.92104 0 0.67145-0.16903 1.3321-0.4915 1.92105-0.32247 0.58895-0.78802 1.08724-1.35372 1.44895 0.14734 0.65717 0.12636 1.3409-0.06099 1.9878-0.18735 0.6469-0.535 1.23602-1.01073 1.71274-0.47572 0.47672-1.06411 0.82561-1.71061 1.01431-0.6465 0.1887-1.33019 0.21111-1.98766 0.06515-0.36124 0.56787-0.85992 1.0354-1.44988 1.35932-0.58995 0.32391-1.2521 0.49373-1.92512 0.49374-0.67303 0-1.33517-0.16982-1.92513-0.49374-0.58995-0.32392-1.08864-0.79145-1.44988-1.35932-0.65717 0.14734-1.3409 0.12636-1.98779-0.06099-0.6469-0.18735-1.23602-0.535-1.71274-1.01073-0.47672-0.47572-0.82561-1.06412-1.01431-1.71061-0.1887-0.6465-0.21112-1.33019-0.06516-1.98766-0.57004-0.36076-1.03959-0.85983-1.36495-1.45079-0.32537-0.59096-0.49598-1.25461-0.49598-1.92922 0-0.67461 0.17062-1.33826 0.49598-1.92921 0.32537-0.59096 0.79491-1.09003 1.36495-1.45079z"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          transform="translate(1.989 2.005)"
        />
        <path
          d="M0 0v4"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(12 8)"
        />
        <path
          d="M12 16h0.01"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "spark") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l1.4 5.2L18 10l-4.6 1.8L12 17l-1.4-5.2L6 10l4.6-1.8L12 3z"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "sliders") {
    const fill = stroke;
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          transform="translate(12 20)"
          d="M.7 0v2q0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268v-2q0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053 .139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268z"
          fill={fill}
        />
        <path
          transform="translate(12 2)"
          d="M.7 0v2q0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268v-2q0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053 .139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268z"
          fill={fill}
        />
        <path
          transform="translate(16 9)"
          d="M.7 0v6q0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268v-6q0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053 .139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268z"
          fill={fill}
        />
        <path
          transform="translate(17 20)"
          d="M.7 0v2q0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268v-2q0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053 .139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268z"
          fill={fill}
        />
        <path
          transform="translate(17 2)"
          d="M.7 0v2q0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268v-2q0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053 .139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268z"
          fill={fill}
        />
        <path
          transform="translate(2 12)"
          d="M0-.7h2q.139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268 0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053h-2q-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268 0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053z"
          fill={fill}
        />
        <path
          transform="translate(2 17)"
          d="M0-.7h2q.139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268 0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053h-2q-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268 0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053z"
          fill={fill}
        />
        <path
          transform="translate(2 7)"
          d="M0-.7h2q.139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268 0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053h-2q-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268 0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053z"
          fill={fill}
        />
        <path
          transform="translate(20 12)"
          d="M0-.7h2q.139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268 0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053h-2q-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268 0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053z"
          fill={fill}
        />
        <path
          transform="translate(20 17)"
          d="M0-.7h2q.139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268 0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053h-2q-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268 0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053z"
          fill={fill}
        />
        <path
          transform="translate(20 7)"
          d="M0-.7h2q.139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268 0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053h-2q-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268 0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053z"
          fill={fill}
        />
        <path
          transform="translate(7 20)"
          d="M.7 0v2q0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268v-2q0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053 .139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268z"
          fill={fill}
        />
        <path
          transform="translate(7 2)"
          d="M.7 0v2q0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268v-2q0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053 .139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268z"
          fill={fill}
        />
        <path
          transform="translate(8 13)"
          d="M0-.7h4q.139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268 0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053h-4q-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268 0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053z"
          fill={fill}
        />
        <path
          transform="translate(8 9)"
          d="M-.7 6v-4q0-.537 .206-1.033 .205-.496 .585-.876 .38-.38 .876-.585 .496-.206 1.033-.206 .537 0 1.033 .206 .496 .205 .876 .585 .38 .38 .585 .876 .206 .496 .206 1.033v4q0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268v-4q0-.259-.099-.497-.099-.239-.282-.422-.183-.183-.422-.282-.238-.099-.497-.099-.259 0-.497 .099-.239 .099-.422 .282-.183 .183-.282 .422-.099 .238-.099 .497v4q0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268z"
          fill={fill}
        />
        <path
          transform="translate(4 4)"
          d="M2-.7h12q.549 0 1.051 .212 .485 .205 .858 .579 .374 .373 .579 .858 .212 .502 .212 1.051v12q0 .549-.212 1.051-.205 .485-.579 .858-.373 .374-.858 .579-.502 .212-1.051 .212h-12q-.549 0-1.051-.212-.485-.205-.858-.579-.374-.373-.579-.858-.212-.502-.212-1.051v-12q0-.549 .212-1.051 .205-.485 .579-.858 .373-.374 .858-.579 .502-.212 1.051-.212zM2 .7q-.265 0-.506 .102-.233 .098-.413 .279-.181 .18-.279 .413-.102 .241-.102 .506v12q0 .265 .102 .506 .098 .233 .279 .413 .18 .181 .413 .279 .241 .102 .506 .102h12q.265 0 .506-.102 .233-.098 .413-.279 .181-.18 .279-.413 .102-.241 .102-.506v-12q0-.265-.102-.506-.098-.233-.279-.413-.18-.181-.413-.279-.241-.102-.506-.102h-12z"
          fill={fill}
        />
      </svg>
    );
  }
  const fill = stroke;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        transform="translate(2.2499 2.2501)"
        d="M19.869 13.482q0 1.456-.427 2.636-.434 1.198-1.28 2.044-.846 .846-2.044 1.28-1.18 .427-2.636 .427h-7.782q-1.459 0-2.642-.427-1.2-.433-2.048-1.279-.847-.846-1.282-2.044-.428-1.181-.428-2.637v-7.8q0-1.462 .283-2.569 .311-1.216 .974-2.048 1.406-1.765 4.336-1.765h2q.705 .001 1.333 .315 .63 .315 1.052 .879l.911 1.212q.225 .299 .56 .466 .334 .167 .708 .168h2.829q1.461 0 2.52 .384 1.105 .402 1.813 1.231 .678 .794 .992 1.988 .286 1.086 .286 2.574l-.028 4.969zM18.469 13.478l.028-4.961q0-1.306-.24-2.218-.233-.885-.703-1.435-.468-.548-1.226-.824-.827-.3-2.042-.3h-2.831q-.703-.001-1.332-.316-.629-.314-1.052-.876l-.915-1.216q-.223-.298-.556-.465-.334-.166-.707-.167h-2q-1.186 0-2.012 .334-.752 .305-1.229 .903-.952 1.195-.952 3.745v7.8q0 1.21 .344 2.159 .328 .905 .955 1.531 .628 .626 1.535 .953 .952 .344 2.166 .344h7.782q1.21 0 2.16-.344 .905-.327 1.53-.953 .626-.625 .953-1.53 .344-.95 .344-2.16z"
        fill={fill}
      />
      <path
        transform="translate(7.481 14.463)"
        d="M0-.7h8.735q.139 0 .268 .053 .129 .054 .227 .152 .098 .098 .152 .227 .053 .129 .053 .268 0 .139-.053 .268-.054 .129-.152 .227-.098 .098-.227 .152-.129 .053-.268 .053h-8.735q-.139 0-.268-.053-.129-.054-.227-.152-.098-.098-.152-.227-.053-.129-.053-.268 0-.139 .053-.268 .054-.129 .152-.227 .098-.098 .227-.152 .129-.053 .268-.053z"
        fill={fill}
      />
    </svg>
  );
}

function WhatItDoesDemoCard({
  title,
  description,
  stepIndex,
}: {
  title: string;
  description: string;
  stepIndex: number;
}) {
  return (
    <div className="relative h-[332px] w-[789px] overflow-hidden rounded-xl border border-[#ebebeb] bg-white">
      <DotPattern />
      <div className="relative flex h-full gap-6 p-6">
        <div className="flex w-[320px] min-h-[284px] flex-col justify-end pb-2">
          <h3
            className="text-base font-semibold tracking-[-0.05em] text-[#585858]"
            style={geist}
          >
            {title}
          </h3>
          <p
            className="mt-2 text-xs leading-normal tracking-[-0.035em] text-[#707070]"
            style={geist}
          >
            {description}
          </p>
        </div>
        {stepIndex === 0 && <ErrorCoachingDemoPanel />}
        {stepIndex === 1 && <ResponsesExplainDemoPanel />}
        {stepIndex === 2 && <CuratedDiscoverDemoPanel />}
        {stepIndex === 3 && <ImportCollectionDemoPanel />}
      </div>
    </div>
  );
}

function ResponsesExplainDemoPanel() {
  return (
    <div className="h-[296px] w-[409px] shrink-0 overflow-hidden rounded-lg bg-[#fafafa]">
      <div className="flex items-center gap-2 px-4 pt-4">
        <AiSparkleIcon />
        <p
          className="text-sm font-medium tracking-[-0.05em] text-[#282828]"
          style={geist}
        >
          AI Explaination
        </p>
      </div>
      <div className="mt-[10px] space-y-2 px-4">
        <ExplainInsightRow
          label="Target users"
          value="Infra teams monitoring node uptime and network health"
        />
        <ExplainInsightRow
          label="Problems it solves"
          value="Skip building your own health-check polling from scratch"
        />
        <ExplainInsightRow
          label="Build Idea"
          value="A status dashboard that alerts you when uptime drops below a threshold"
          highlight
        />
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

function CuratedDiscoverDemoPanel() {
  return (
    <div className="relative h-[284px] w-[409px] shrink-0 overflow-hidden rounded-lg bg-[#f0f0ff]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/discover-curated.png"
        alt=""
        width={163}
        height={162}
        className="absolute left-[123px] top-[61px] h-[162px] w-[163px] object-cover"
        draggable={false}
      />
    </div>
  );
}

function ImportCollectionDemoPanel() {
  return (
    <div className="h-[280px] w-[409px] shrink-0 overflow-hidden rounded-lg bg-[#fafafa] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
          <FolderGlyphIcon className="h-[18px] w-[18px]" color="#595959" />
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-medium tracking-[-0.05em] text-[#595858]"
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
      <div className="relative mt-[14px] h-[176px] w-[377px] overflow-hidden rounded-md bg-white">
        <div className="px-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-sm font-medium tracking-[-0.05em] text-[#585858]"
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
            <div className="h-full w-[74.79%] rounded-sm bg-[#9b9bff]" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p
              className="text-sm font-medium tracking-[-0.05em] text-[#585858]"
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
            <div className="h-full w-[74.79%] rounded-sm bg-[#9b9bff]" />
          </div>
        </div>
        <div className="absolute left-3 top-[92px] h-[72px] w-[353px] overflow-hidden rounded-lg border-[0.6px] border-[#ffdaae] bg-[#fffdfa]">
          <div className="absolute left-2 top-2 flex items-center gap-1">
            <WarningSparkleIcon />
            <p
              className="text-xs font-medium tracking-[-0.06em] text-[#dd7800]"
              style={geist}
            >
              You collection is bigger than the space you have
            </p>
          </div>
          <div className="absolute left-1 top-8 h-9 w-[345px] overflow-hidden rounded-md bg-[#fff3e0]">
            <p
              className="px-2 pt-2 text-xs font-normal leading-[1.67] tracking-[-0.04em] text-[#a95c00]"
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
      className="shrink-0"
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

function ErrorCoachingDemoPanel() {
  return (
    <div className="relative h-[296px] w-[409px] shrink-0 overflow-hidden rounded-lg bg-[#fafafa]">
      <div className="flex items-start justify-between gap-2 px-4 pb-0 pt-4">
        <p
          className="text-sm font-medium tracking-[-0.05em] text-[#585858]"
          style={geist}
        >
          PUT request. api.example/v1/charges
        </p>
        <span
          className="-mt-1 shrink-0 rounded-md bg-[#ffdada] px-2 py-1 text-sm font-normal tracking-[-0.04em] text-[#c70000]"
          style={geist}
        >
          200
        </span>
      </div>
      <JsonErrorRow />
      <ExplainCard />
    </div>
  );
}

function JsonErrorRow() {
  return (
    <div className="mx-4 mt-3.5 flex h-10 items-center overflow-hidden rounded-md bg-white px-3">
      <p
        className="truncate text-xs font-normal tracking-[-0.05em] text-[#585858]"
        style={geist}
      >
        {`{“error”: “invalid_api_key”, “message”: “no  valid API key provided”}`}
      </p>
    </div>
  );
}

function ExplainCard() {
  return (
    <div className="relative mx-4 mt-4 h-[170px] w-[377px] overflow-hidden rounded-md border border-[#f2f2f2] bg-white">
      <div className="absolute left-3 top-3 flex max-w-[305px] flex-wrap items-center gap-2">
        <span
          className="text-xs font-normal tracking-[-0.06em] text-[#585858]"
          style={geist}
        >
          Authorization
        </span>
        <span
          className="rounded bg-[#ffd6d6] px-2 py-0.5 text-xs font-normal leading-5 tracking-[-0.04em] text-[#ff1616]"
          style={geist}
        >
          Bearer sk_live_4f8a2c9d1e7b6f30
        </span>
      </div>
      <div className="absolute left-1 top-11 h-[122px] w-[369px] overflow-hidden rounded bg-[#f7f7f7]">
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <CoachLightbulbIcon />
          <p
            className="text-sm font-medium leading-none tracking-[-0.05em] text-[#585858]"
            style={geist}
          >
            Wrong auth scheme
          </p>
        </div>
        <p
          className="absolute left-3 top-[34px] max-w-[345px] text-xs font-normal leading-5 tracking-[-0.04em] text-[#939393]"
          style={geist}
        >
          This API expects an x-api key header, not a bearer token. The key
          itself looks valid- its just in the wrong place
        </p>
        <span
          className="absolute left-3 top-[82px] inline-flex rounded-md bg-white px-2 py-1.5 text-xs font-normal tracking-[-0.04em] text-[#5b5bff]"
          style={geist}
        >
          Fix header
        </span>
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

function DotPattern() {
  return (
    <div
      className="pointer-events-none absolute left-2 top-2 grid grid-cols-5 gap-3"
      aria-hidden
    >
      {Array.from({ length: 25 }).map((_, i) => (
        <span key={i} className="size-1 rounded-full bg-[#f7f7f7]" />
      ))}
    </div>
  );
}
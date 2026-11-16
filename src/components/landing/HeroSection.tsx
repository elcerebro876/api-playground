"use client";

import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingFooter from "@/components/landing/LandingFooter";
import PrivacySection from "@/components/landing/PrivacySection";
import WhatItDoesSection from "@/components/landing/WhatItDoesSection";

type HeroSectionProps = {
  onTryFree: () => void;
  onStartSample: () => void;
};

export default function HeroSection({
  onTryFree,
  onStartSample,
}: HeroSectionProps) {
  return (
    <div className="min-h-full bg-white text-[#3d3d3d]">
      <LandingHeader />
      <main className="mx-auto w-full max-w-[1200px] px-16 pb-16 pt-8">
        <LandingTaglineBlock
          onTryFree={onTryFree}
          onStartSample={onStartSample}
        />
        <LandingProductShot />
        <WhatItDoesSection />
        <HowItWorksSection />
        <PrivacySection />
        <LandingFooter onTryFree={onTryFree} />
      </main>
    </div>
  );
}

function LandingHeader() {
  return (
    <header
      data-landing-header
      className="sticky top-0 z-50 mx-auto flex w-full max-w-[1200px] items-center justify-between bg-white px-16 pb-2 pt-9"
    >
      <span
        className="text-sm font-semibold tracking-[-0.07em] text-[#3d3d3d]"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        Playground
      </span>
      <nav
        className="hidden items-center gap-6 md:flex"
        aria-label="Landing sections"
      >
        {[
          { label: "What it does", active: true },
          { label: "How it works", active: false },
          { label: "Privacy", active: false },
        ].map((item) => (
          <span
            key={item.label}
            className={`text-base font-medium tracking-[-0.035em] ${
              item.active ? "text-[#4e4e4e]" : "text-[#8c8c8c]"
            }`}
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            {item.label}
          </span>
        ))}
      </nav>
      <a
        href="https://github.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md bg-[#222222] px-3 py-1.5"
      >
        <GithubStarIcon />
        <span
          className="text-xs font-medium tracking-[-0.035em] text-white"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Star on Github
        </span>
      </a>
    </header>
  );
}

function LandingTaglineBlock({
  onTryFree,
  onStartSample,
}: {
  onTryFree: () => void;
  onStartSample: () => void;
}) {
  return (
    <>
      <div className="mt-12 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <h1
          className="max-w-[464px] text-[30px] font-semibold leading-[1.2] tracking-[-0.05em] text-[#3d3d3d]"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Paste an API you&apos;ve never used, every response tells you what you
          could build.
        </h1>
        <p
          className="max-w-[386px] text-base font-normal leading-normal tracking-[-0.035em] text-[#707070] lg:pt-1"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          When a request fails, Playground tells you what went wrong and how to
          fix it. When it works, it tells you what you could build.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-4">
        <button
          type="button"
          onClick={onTryFree}
          className="rounded-md bg-[#5b5bff] px-3 py-1.5 text-xs font-medium tracking-[-0.035em] text-white"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Try it free
        </button>
        <button
          type="button"
          onClick={onStartSample}
          className="rounded-md border border-[#f2f2f2] bg-white px-3 py-1.5 text-xs font-medium tracking-[-0.035em] text-[#3d3d3d]"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Start from a sample API
        </button>
      </div>
    </>
  );
}

function LandingProductShot() {
  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-[#f2f2f2] bg-[#fafafa] px-4 pb-4 pt-10 lg:mt-6 lg:pb-0">
      <div className="absolute left-5 top-[15px] flex items-center gap-2">
        <span className="size-2 rounded-full bg-[#fb7269]" aria-hidden />
        <span className="size-2 rounded-full bg-[#fdbb2e]" aria-hidden />
        <span className="size-2 rounded-full bg-[#31c553]" aria-hidden />
      </div>
      <div className="relative mx-auto w-full max-w-[1054px] overflow-hidden rounded-lg bg-white">
        <div className="relative h-0 w-full pb-[calc(100%*749/1054-16px)]">
          <video
            className="absolute inset-0 object-contain object-top"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/landing/hero-demo-poster.jpg"
            aria-hidden
          >
            <source src="/landing/hero-demo.webm" type="video/webm" />
          </video>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 rounded-b-xl bg-[#fafafa] lg:h-14"
        aria-hidden
      />
    </div>
  );
}

function GithubStarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M13.75 7.18c-2.91-.75-5.18-3.02-5.93-5.93l-.32-1.25-.32 1.25c-.75 2.91-3.02 5.18-5.93 5.93l-1.25.32 1.25.32c2.91.75 5.18 3.02 5.93 5.93l.32 1.25.32-1.25c.75-2.91 3.02-5.18 5.93-5.93l1.25-.32z"
        fill="#fff"
        fillRule="evenodd"
      />
    </svg>
  );
}
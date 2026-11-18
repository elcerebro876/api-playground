"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingFooter from "@/components/landing/LandingFooter";
import PrivacySection from "@/components/landing/PrivacySection";
import TryItHereSection from "@/components/landing/TryItHereSection";
import MobileHowItWorksSection from "@/components/landing/mobile/MobileHowItWorksSection";
import MobileLandingFooter from "@/components/landing/mobile/MobileLandingFooter";
import MobileLandingMenu from "@/components/landing/mobile/MobileLandingMenu";
import MobilePrivacySection from "@/components/landing/mobile/MobilePrivacySection";
import MobileUnderWorksBanner from "@/components/landing/mobile/MobileUnderWorksBanner";
import MobileWhatItDoesSection from "@/components/landing/mobile/MobileWhatItDoesSection";
import WhatItDoesSection from "@/components/landing/WhatItDoesSection";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const LANDING_NAV = [
  { label: "What it does", id: "what-it-does" },
  { label: "How it works", id: "how-it-works" },
  { label: "Privacy", id: "privacy" },
] as const;

const HERO_TEXT_REVEAL = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const GITHUB_REPO =
  "https://github.com/elcerebro876/api-playground";

type HeroSectionProps = {
  onTryFree: () => void;
  onStartSample: () => void;
  onSendSample: () => void;
};

export default function HeroSection({
  onTryFree,
  onStartSample,
  onSendSample,
}: HeroSectionProps) {
  return (
    <div className="min-h-full bg-white text-[#3d3d3d]">
      <LandingHeader />
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-4 lg:px-16 lg:pb-16 lg:pt-8">
        <LandingTaglineBlock
          onTryFree={onTryFree}
          onStartSample={onStartSample}
        />
        <LandingProductShot />
        <MobileUnderWorksBanner />
        <MobileWhatItDoesSection />
        <MobileHowItWorksSection />
        <MobilePrivacySection />
        <div className="hidden lg:block">
          <WhatItDoesSection />
          <HowItWorksSection />
          <TryItHereSection onSend={onSendSample} />
          <PrivacySection />
          <LandingFooter onTryFree={onTryFree} />
        </div>
        <MobileLandingFooter onTryFree={onTryFree} />
      </main>
    </div>
  );
}

function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId);
  const header = document.querySelector<HTMLElement>("[data-landing-header]");
  if (!target) return;
  const top =
    target.getBoundingClientRect().top +
    window.scrollY -
    (header?.offsetHeight ?? 0);
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function LandingHeader() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            ratios.set(entry.target.id, entry.intersectionRatio);
          } else {
            ratios.delete(entry.target.id);
          }
        }

        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        setActiveSection(bestRatio >= 0.15 ? bestId : null);
      },
      { rootMargin: "-32% 0px -50% 0px", threshold: [0, 0.15, 0.35, 0.6] },
    );

    for (const item of LANDING_NAV) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <header
      data-landing-header
      className="sticky top-0 z-50 mx-auto flex w-full max-w-[1200px] items-center justify-between bg-white px-4 pb-2 pt-6 lg:px-16 lg:pt-9"
    >
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="text-sm font-semibold tracking-[-0.07em] text-[#3d3d3d]"
        style={geist}
      >
        Playground
      </a>
      <nav
        className="hidden items-center gap-6 lg:flex"
        aria-label="Landing sections"
      >
        {LANDING_NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(item.id);
            }}
            className={`text-base font-medium tracking-[-0.035em] transition-colors ${
              activeSection === item.id ? "text-[#4e4e4e]" : "text-[#8c8c8c]"
            }`}
            style={geist}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <a
          href={GITHUB_REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded-md bg-[#222222] px-3 py-1.5 lg:inline-flex"
        >
          <GithubStarIcon />
          <span
            className="text-xs font-medium tracking-[-0.035em] text-white"
            style={geist}
          >
            Star on Github
          </span>
        </a>
        <MobileLandingMenu />
      </div>
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
      <div className="mt-6 flex flex-col gap-2 lg:mt-12 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <motion.h1
          className="max-w-[343px] text-lg font-semibold leading-[1.2] tracking-[-0.05em] text-[#3d3d3d] lg:max-w-[464px] lg:text-[30px]"
          style={geist}
          variants={HERO_TEXT_REVEAL}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          Paste an API you&apos;ve never used, every response tells you what you
          could build.
        </motion.h1>
        <motion.p
          className="max-w-[343px] text-xs font-normal leading-normal tracking-[-0.035em] text-[#707070] lg:max-w-[386px] lg:pt-1 lg:text-base"
          style={geist}
          variants={HERO_TEXT_REVEAL}
          initial="hidden"
          animate="visible"
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.08,
          }}
        >
          When a request fails, Playground tells you what went wrong and how to
          fix it. When it works, it tells you what you could build.
        </motion.p>
      </div>
      <motion.div
        className="mt-3 flex flex-wrap items-center gap-2 lg:mt-4"
        variants={HERO_TEXT_REVEAL}
        initial="hidden"
        animate="visible"
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.16,
        }}
      >
        <motion.button
          type="button"
          onClick={onTryFree}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-pointer rounded-md bg-[#5b5bff] px-3 py-1.5 text-xs font-medium tracking-[-0.035em] text-white shadow-sm hover:bg-[#4f4fef] hover:shadow-md active:bg-[#4545e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bff]/45 focus-visible:ring-offset-2"
          style={geist}
        >
          Try it free
        </motion.button>
        <motion.button
          type="button"
          onClick={onStartSample}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-pointer rounded-md border border-[#f2f2f2] bg-white px-3 py-1.5 text-xs font-medium tracking-[-0.035em] text-[#3d3d3d] shadow-sm hover:border-[#e0e0e0] hover:bg-[#fafafa] hover:shadow-md active:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bff]/30 focus-visible:ring-offset-2"
          style={geist}
        >
          Start from a sample API
        </motion.button>
      </motion.div>
    </>
  );
}

function LandingProductShot() {
  const dotDelays = ["0ms", "150ms", "300ms"];

  return (
    <motion.div
      className="relative mt-4 h-[276px] overflow-hidden rounded-xl border border-[#f2f2f2] bg-[#fafafa] px-2 pb-2 pt-10 lg:h-auto lg:px-4 lg:pb-0 lg:pt-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
    >
      <div className="absolute left-3 top-3 flex items-center gap-3.5 lg:left-5 lg:top-[15px] lg:gap-2">
        {["#fb7269", "#fdbb2e", "#31c553"].map((color, index) => (
          <span
            key={color}
            className="size-1.5 rounded-full lg:size-2"
            style={{
              backgroundColor: color,
              animation: "pixel-on 1s ease-in-out infinite",
              animationDelay: dotDelays[index],
            }}
            aria-hidden
          />
        ))}
      </div>
      <div className="relative mx-auto h-[232px] w-full max-w-[1054px] overflow-hidden rounded-lg bg-white lg:h-auto">
        <div className="relative size-full lg:h-0 lg:pb-[calc(100%*749/1054-16px)]">
          <video
            className="absolute inset-0 size-full object-cover object-top lg:object-contain"
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
    </motion.div>
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
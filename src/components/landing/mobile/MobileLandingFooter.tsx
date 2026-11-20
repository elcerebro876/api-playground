"use client";

import { track } from "@/lib/posthog";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const SITEMAP_LINKS = [
  { label: "Home", href: "#" },
  { label: "What it does", href: "#what-it-does" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Privacy", href: "#privacy" },
] as const;

type MobileLandingFooterProps = {
  onTryFree: () => void;
};

export default function MobileLandingFooter({
  onTryFree,
}: MobileLandingFooterProps) {
  return (
    <footer className="relative z-10 mt-20 px-4 pb-10 lg:hidden">
      <div className="relative mx-auto max-w-[343px] overflow-hidden rounded-xl bg-[#9ec9eb]">
        <div className="relative z-10 mx-4 my-9 overflow-hidden rounded-lg bg-white px-3 pb-3 pt-3 shadow-sm">
          <p
            className="text-sm font-semibold tracking-[-0.05em] text-[#3d3d3d]"
            style={geist}
          >
            Try it on an API you don&apos;t trust yet
          </p>
          <p
            className="mt-2 text-xs font-normal tracking-[-0.035em] text-[#707070]"
            style={geist}
          >
            Then tell me where it breaks. I read every message
          </p>
          <button
            type="button"
            onClick={() => {
              track({
                name: "landing_cta_clicked",
                properties: { which: "final" },
              });
              onTryFree();
            }}
            className="mt-4 rounded-md bg-[#5b5bff] px-3 py-1.5 text-xs font-medium tracking-[-0.035em] text-white"
            style={geist}
          >
            Try it free
          </button>

          <div className="mt-3 overflow-hidden rounded-lg border border-[#f2f2f2] px-3 py-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <p
                className="font-medium tracking-[-0.05em] text-[#6b6b6b]"
                style={geist}
              >
                Playground
              </p>
              <div>
                <p
                  className="font-medium tracking-[-0.05em] text-[#3d3d3d]"
                  style={geist}
                >
                  Sitemap
                </p>
                <ul className="mt-2 space-y-2">
                  {SITEMAP_LINKS.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="font-normal tracking-[-0.035em] text-[#707070]"
                        style={geist}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="font-medium tracking-[-0.05em] text-[#3d3d3d]"
                  style={geist}
                >
                  Opensource
                </p>
                <a
                  href="https://github.com/elcerebro876/api-playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-normal tracking-[-0.035em] text-[#707070]"
                  style={geist}
                >
                  Star on Github
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
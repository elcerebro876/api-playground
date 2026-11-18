"use client";

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
    <footer className="mt-20 px-4 pb-10 lg:hidden">
      <div className="relative overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/n0KpHa.png"
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
          aria-hidden
        />
        <div className="relative p-4">
          <div className="rounded-lg bg-white p-3">
            <p
              className="text-sm font-semibold tracking-[-0.05em] text-[#3d3d3d]"
              style={geist}
            >
              Try it on an API you don&apos;t trust yet
            </p>
            <p
              className="mt-1 text-xs font-normal tracking-[-0.035em] text-[#707070]"
              style={geist}
            >
              Then tell me where it breaks. I read every message
            </p>
            <button
              type="button"
              onClick={onTryFree}
              className="mt-3 rounded-md bg-[#5b5bff] px-3 py-1.5 text-xs font-medium tracking-[-0.035em] text-white"
              style={geist}
            >
              Try it free
            </button>

            <div className="mt-4 rounded-lg border border-[#f2f2f2] p-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium text-[#3d3d3d]" style={geist}>
                    Playground
                  </p>
                </div>
                <div>
                  <p className="font-medium text-[#3d3d3d]" style={geist}>
                    Sitemap
                  </p>
                  <ul className="mt-2 space-y-2">
                    {SITEMAP_LINKS.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-[#707070]"
                          style={geist}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-[#3d3d3d]" style={geist}>
                    Opensource
                  </p>
                  <a
                    href="https://github.com/elcerebro876/api-playground"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[#707070]"
                    style={geist}
                  >
                    Star on Github
                  </a>
                </div>
              </div>
            </div>

            <p
              className="mt-6 overflow-hidden text-[clamp(3.5rem,22vw,6.125rem)] font-medium leading-none tracking-[-0.05em] text-[#4f46e5]"
              style={geist}
              aria-hidden
            >
              Playground
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

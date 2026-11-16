"use client";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const SITEMAP_LINKS = [
  { label: "Home", href: "#", top: 41 },
  { label: "What it does", href: "#what-it-does", top: 71 },
  { label: "How it works", href: "#how-it-works", top: 101 },
  { label: "Privacy", href: "#privacy", top: 131 },
] as const;

type LandingFooterProps = {
  onTryFree: () => void;
};

export default function LandingFooter({ onTryFree }: LandingFooterProps) {
  return (
    <footer className="hidden lg:mt-[81px] lg:block">
      <div className="relative h-[546px] w-full overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/n0KpHa.png"
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
          aria-hidden
        />
        <div className="relative flex h-full items-center justify-center">
          <div className="relative h-[434px] w-[703px] overflow-hidden rounded-lg bg-white">
            <p
              className="absolute left-4 top-4 max-w-[339px] text-lg font-semibold leading-[23px] tracking-[-0.05em] text-[#3d3d3d]"
              style={geist}
            >
              Try it on an API you don&apos;t trust yet
            </p>
            <p
              className="absolute left-4 top-[47px] max-w-[320px] text-sm font-normal leading-[18px] tracking-[-0.035em] text-[#707070]"
              style={geist}
            >
              Then tell me where it breaks. I read every message
            </p>
            <button
              type="button"
              onClick={onTryFree}
              className="absolute left-[613px] top-4 flex h-7 items-center justify-center rounded-md bg-[#5b5bff] px-3 py-1.5 text-xs font-medium tracking-[-0.035em] text-white"
              style={geist}
            >
              Try it free
            </button>

            <div className="absolute left-4 top-[77px] box-border h-[161px] w-[671px] overflow-hidden rounded-md border border-[#f2f2f2] bg-white">
              <p
                className="absolute left-3 top-3 text-base font-medium leading-[21px] tracking-[-0.05625em] text-[#6b6b6b]"
                style={geist}
              >
                Playground
              </p>
              <p
                className="absolute left-[398px] top-3 text-base font-medium leading-[21px] tracking-[-0.05625em] text-[#3d3d3d]"
                style={geist}
              >
                Sitemap
              </p>
              {SITEMAP_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="absolute left-[398px] text-sm font-normal leading-[18px] tracking-[-0.035em] text-[#707070]"
                  style={{ ...geist, top: link.top }}
                >
                  {link.label}
                </a>
              ))}
              <p
                className="absolute left-[565px] top-3 text-base font-medium leading-[21px] tracking-[-0.05625em] text-[#3d3d3d]"
                style={geist}
              >
                Opensource
              </p>
              <a
                href="https://github.com/elcerebro876/api-playground"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute left-[565px] top-[41px] text-sm font-normal leading-[18px] tracking-[-0.035em] text-[#707070]"
                style={geist}
              >
                Star on Github
              </a>
            </div>

            <p
              className="absolute left-4 top-[254px] text-sm font-normal leading-[18px] tracking-[-0.035em] text-[#707070]"
              style={geist}
            >
              Playground 2026
            </p>
            <p
              className="pointer-events-none absolute left-10 top-[318px] max-w-[617px] select-none overflow-hidden text-[128px] font-medium leading-none tracking-[-0.05em] text-[#4f46e5]"
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
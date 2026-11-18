"use client";

import { useEffect, useState, type ReactNode } from "react";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

const MOBILE_NAV = [
  { label: "What it does", id: "what-it-does" },
  { label: "How it works", id: "how-it-works" },
  { label: "Privacy", id: "privacy" },
] as const;

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

export default function MobileLandingMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="inline-flex size-[18px] flex-col items-center justify-between py-0.5 lg:hidden"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="h-px w-3 bg-black" aria-hidden />
        <span className="h-px w-3 bg-black" aria-hidden />
        <span className="h-px w-3 bg-black" aria-hidden />
      </button>

      {open ? (
        <MenuBackdrop onClose={() => setOpen(false)}>
          <nav
            className="flex flex-col gap-4 px-4 py-6"
            aria-label="Landing sections"
          >
            {MOBILE_NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-base font-medium tracking-[-0.035em] text-[#4e4e4e]"
                style={geist}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  scrollToSection(item.id);
                }}
              >
                {item.label}
              </a>
            ))}
            <a
              href="https://github.com/elcerebro876/api-playground"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium tracking-[-0.035em] text-[#4e4e4e]"
              style={geist}
              onClick={() => setOpen(false)}
            >
              Star on Github
            </a>
          </nav>
        </MenuBackdrop>
      ) : null}
    </>
  );
}

function MenuBackdrop({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 w-[min(280px,85vw)] bg-white shadow-lg lg:hidden">
        {children}
      </div>
    </>
  );
}
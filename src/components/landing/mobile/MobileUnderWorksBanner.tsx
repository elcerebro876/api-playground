"use client";

const geist = { fontFamily: "var(--font-geist-sans)" } as const;

export default function MobileUnderWorksBanner() {
  return (
    <div
      role="status"
      className="mx-[-1rem] mt-9 flex h-[50px] items-center justify-center bg-[#222222] lg:hidden"
    >
      <p
        className="px-4 text-center text-sm font-semibold tracking-[-0.05em] text-white"
        style={geist}
      >
        The mobile version is currently still under works
      </p>
    </div>
  );
}
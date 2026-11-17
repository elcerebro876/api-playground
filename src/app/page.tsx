"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import HeroSection from "@/components/landing/HeroSection";
import { savePlaygroundEntered } from "@/lib/storage";

export default function LandingPage() {
  const router = useRouter();

  const enterPlayground = useCallback(
    (href: string) => {
      savePlaygroundEntered(true);
      router.push(href);
    },
    [router],
  );

  return (
    <div className="min-h-screen">
      <HeroSection
        onTryFree={() => enterPlayground("/play")}
        onStartSample={() => enterPlayground("/play?discover=1")}
        onSendSample={() => enterPlayground("/play")}
      />
    </div>
  );
}
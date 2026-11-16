"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadPlaygroundEntered } from "@/lib/storage";

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (loadPlaygroundEntered()) {
      setAllowed(true);
      return;
    }
    router.replace("/");
  }, [router]);

  if (!allowed) {
    return null;
  }

  return children;
}
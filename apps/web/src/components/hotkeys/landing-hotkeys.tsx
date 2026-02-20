"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "next/navigation";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function LandingHotkeys() {
  const router = useRouter();
  useHotkey("G", () => {
    router.push("/dashboard");
  });

  return null;
}

"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { useTheme } from "next-themes";

export function GlobalHotkeys() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  useHotkey("Mod+D", () => {
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  });

  return null;
}

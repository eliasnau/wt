"use client";

import { env } from "@repo/env/web";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { usePathname } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { queryClient } from "@/utils/orpc";
import { GlobalHotkeys } from "./hotkeys/global-hotkeys";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lightPages = ["/terms", "/privacy"];
  const isLightPage = false;
  // lightPages.some((path) => pathname.startsWith(path);
  const forcedTheme = isLightPage ? "light" : undefined;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={forcedTheme}
      disableTransitionOnChange
    >
      <HotkeysProvider
        defaultOptions={{
          hotkey: {
            preventDefault: true,
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </AuthProvider>
        </QueryClientProvider>
        <GlobalHotkeys />
      </HotkeysProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}

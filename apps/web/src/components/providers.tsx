"use client";

import { env } from "@repo/env/web";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { usePathname } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { queryClient } from "@/utils/orpc";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const lightPages = ["/terms", "/privacy"];
	const isLightPage =
		lightPages.some((path) => pathname.startsWith(path)) || pathname == "/";
	const forcedTheme = isLightPage ? "light" : undefined;

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			forcedTheme={forcedTheme}
			disableTransitionOnChange
		>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<NuqsAdapter>{children}</NuqsAdapter>
				</AuthProvider>
			</QueryClientProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}

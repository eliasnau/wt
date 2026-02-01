"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient } from "@/utils/orpc";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthProvider } from "@/providers/auth-provider";
import { env } from "@repo/env/web";
import { usePathname } from "next/navigation";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export default function Providers({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const lightPages = ['/terms', '/privacy']
	const isLightPage = lightPages.some(path => pathname.startsWith(path)) || pathname == "/"
	const forcedTheme = isLightPage ? 'light' : undefined

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			forcedTheme={forcedTheme}
			disableTransitionOnChange
		>
			<QueryClientProvider client={queryClient}>
				<ConvexProvider client={convex}>
					<AuthProvider>
						<NuqsAdapter>{children}</NuqsAdapter>
					</AuthProvider>
				</ConvexProvider>
			</QueryClientProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}

"use client";

import { AutumnProvider } from "@repo/autumn/react";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthProvider } from "@/providers/auth-provider";
import { queryClient } from "@/utils/orpc";
import { GlobalHotkeys } from "./hotkeys/global-hotkeys";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
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
						<AutumnProvider>
							<NuqsAdapter>{children}</NuqsAdapter>
						</AutumnProvider>
					</AuthProvider>
				</QueryClientProvider>
				<GlobalHotkeys />
			</HotkeysProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}

"use client";

import { useAuth } from "@clerk/nextjs";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useTheme } from "next-themes";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { dark, shadcn } from "@clerk/themes";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
	const { resolvedTheme } = useTheme();
	const clerkTheme = resolvedTheme === "dark" ? dark : undefined;

	return (
		<ClerkProvider
			waitlistUrl="/waitlist"
			signInUrl="/sign-in"
			signUpUrl="/sign-up"
			taskUrls={{
				"choose-organization": "/organizations",
			}}
			appearance={{
				baseTheme: clerkTheme,
			}}
		>
			{children}
		</ClerkProvider>
	);
}

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<ClerkProviderWrapper>
				<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
					{children}
				</ConvexProviderWithClerk>
				<Toaster richColors />
			</ClerkProviderWrapper>
		</ThemeProvider>
	);
}

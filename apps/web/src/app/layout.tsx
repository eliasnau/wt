import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "@/components/providers";
import { shadcn } from "@clerk/themes";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "repo",
	description: "repo",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ClerkProvider
					waitlistUrl="/waitlist"
					signInUrl="/sign-in"
					signUpUrl="/sign-up"
					taskUrls={{
						"choose-organization": "/organizations",
					}}
					appearance={{
						theme: shadcn,
					}}
				>
					<Providers>
						<div className="grid grid-rows-[auto_1fr] h-svh">{children}</div>
					</Providers>
				</ClerkProvider>
			</body>
		</html>
	);
}

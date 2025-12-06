import type { Metadata } from "next";
import { Cal_Sans, Geist, Inter } from "next/font/google";
import "../index.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "@/components/providers";
import { shadcn } from "@clerk/themes";

const fontSans = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
});

const fontHeading = Cal_Sans({
	subsets: ["latin"],
	variable: "--font-heading",
	weight: "400",
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
				className={`${fontSans.variable} ${fontHeading.variable} antialiased`}
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

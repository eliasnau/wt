import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "../index.css";
import { DevMode } from "@/components/dev-mode";
import Providers from "@/components/providers";

const fontSans = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
});

const fontHeading = localFont({
	src: "../fonts/CalSans-Regular.woff2",
	variable: "--font-heading",
	display: "swap",
	weight: "400",
});

export const metadata: Metadata = {
	title: "matdesk",
	description: "matdesk",
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
				<Providers>
					<DevMode />
					<div className="grid h-svh grid-rows-[auto_1fr]">{children}</div>
				</Providers>
			</body>
		</html>
	);
}

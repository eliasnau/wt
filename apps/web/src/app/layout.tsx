import type { Metadata } from "next";
import { Cal_Sans, Inter } from "next/font/google";
import "../index.css";
import { DevMode } from "@/components/dev-mode";
import Providers from "@/components/providers";

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
				<Providers>
					<DevMode />
					<div className="grid h-svh grid-rows-[auto_1fr]">{children}</div>
				</Providers>
			</body>
		</html>
	);
}

import type { Metadata } from "next";
import { Cal_Sans, Geist, Inter } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

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
					<ReactQueryDevtools initialIsOpen={false} />
					<div className="grid grid-rows-[auto_1fr] h-svh">{children}</div>
				</Providers>
			</body>
		</html>
	);
}

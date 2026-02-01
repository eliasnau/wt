import { defineI18nUI } from "fumadocs-ui/i18n";
import { RootProvider } from "fumadocs-ui/provider/next";
import { i18n } from "@/lib/i18n";
import "../global.css";
import { Inter } from "next/font/google";

const inter = Inter({
	subsets: ["latin"],
});

const { provider } = defineI18nUI(i18n, {
	translations: {
		en: {
			displayName: "English",
		},
		de: {
			displayName: "German",
		},
	},
});

export default async function RootLayout({
	params,
	children,
}: {
	params: Promise<{ lang: string }>;
	children: React.ReactNode;
}) {
	const lang = (await params).lang;

	return (
		<html lang={lang} className={inter.className} suppressHydrationWarning>
			<body className="flex min-h-screen flex-col">
				<RootProvider i18n={provider(lang)}>{children}</RootProvider>
			</body>
		</html>
	);
}

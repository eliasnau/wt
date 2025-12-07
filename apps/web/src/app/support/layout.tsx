import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Support",
	description:
		"Contact our priority support team for help with your account or organization",
};

export default function SupportLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

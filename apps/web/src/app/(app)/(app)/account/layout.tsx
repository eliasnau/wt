"use client";

import { ArrowLeft, Building2, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const accountNavItems = [
	{
		title: "General",
		href: "/account",
		icon: User,
	},
	{
		title: "Sicherheit",
		href: "/account/security",
		icon: Shield,
	},
	{
		title: "Organizations",
		href: "/account/organizations",
		icon: Building2,
	},
] as const;

export default function AccountLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();

	return <>{children}</>;
}

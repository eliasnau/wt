"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Building2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const accountNavItems = [
	{
		title: "General",
		href: "/account",
		icon: User,
	},
	{
		title: "Security",
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

	return (
		<div className="min-h-screen">
			<div className="border-b">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="flex h-14 items-center">
						<button
							onClick={() => router.push("/dashboard")}
							className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<ArrowLeft className="h-4 w-4" />
							<span className="hidden sm:inline">Dashboard</span>
						</button>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="border-b">
					<div className="py-6">
						<h1 className="text-2xl font-semibold">Account Settings</h1>
					</div>

					<nav className="-mb-px flex gap-6 overflow-x-auto">
						{accountNavItems.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;

							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors whitespace-nowrap",
										isActive
											? "border-primary text-foreground"
											: "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
									)}
								>
									<Icon className="size-4" />
									<span>{item.title}</span>
								</Link>
							);
						})}
					</nav>
				</div>

				<main className="py-6 sm:py-8">{children}</main>
			</div>
		</div>
	);
}

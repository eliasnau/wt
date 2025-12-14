"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const accountNavItems = [
	{
		title: "General",
		description: "Personal information",
		href: "/account",
		icon: User,
	},
	{
		title: "Security",
		description: "Password & authentication",
		href: "/account/security",
		icon: Shield,
	},
];

export default function AccountLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	return (
		<div className="bg-sidebar">
		<div className="container max-w-6xl mx-auto py-8 space-y-8">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
				<p className="text-base text-muted-foreground">
					Manage your account settings and preferences
				</p>
			</div>

			<Separator />

			<div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
				<aside className="lg:w-56 shrink-0">
					<nav className="flex gap-1 lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
						{accountNavItems.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;
							
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"group flex items-start gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all whitespace-nowrap lg:whitespace-normal",
										isActive
											? "bg-primary text-primary-foreground shadow-sm"
											: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
									)}
								>
									<Icon className={cn(
										"size-5 shrink-0 mt-0.5",
										isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
									)} />
									<div className="hidden lg:block">
										<div className={cn(
											"font-semibold",
											isActive ? "text-primary-foreground" : ""
										)}>
											{item.title}
										</div>
										<div className={cn(
											"text-xs",
											isActive ? "text-primary-foreground/80" : "text-muted-foreground"
										)}>
											{item.description}
										</div>
									</div>
									<span className="lg:hidden">{item.title}</span>
								</Link>
							);
						})}
					</nav>
				</aside>

				<main className="flex-1 min-w-0">
					{children}
				</main>
			</div>
		</div>
		</div>
	);
}

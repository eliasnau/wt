"use client";

import type { Route } from "next";
import Link from "next/link";
import { MobileNav } from "@/components/landing/mobile-nav";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useScroll } from "@/hooks/use-scroll";
import type { getServerSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const navLinks = [
	{
		label: "Funktionen",
		href: "#features",
	},
	{
		label: "Preise",
		href: "#pricing",
	},
	{
		label: "Über uns",
		href: "#about",
	},
];

interface HeaderProps {
	className?: string;
	session?: Awaited<ReturnType<typeof getServerSession>>;
}

export function Header({ className, session }: HeaderProps) {
	const scrolled = useScroll(10);
	const isSignedIn = !!session?.user;

	return (
		<header
			className={cn(
				"sticky top-0 z-50 mx-auto w-full border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
				{
					"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-4xl md:shadow":
						scrolled,
				},
				className,
			)}
		>
			<nav
				className={cn(
					"flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
					{
						"md:px-2": scrolled,
					},
				)}
			>
				<Link
					className="rounded-md p-2 hover:bg-muted dark:hover:bg-muted/50"
					href="/"
				>
					<Logo className="h-4" />
				</Link>
				<div className="hidden items-center gap-2 md:flex">
					<div>
						{navLinks.map((link) => (
							<Button
								key={link.label}
								size="sm"
								variant="ghost"
								render={<a href={link.href} />}
							>
								{link.label}
							</Button>
						))}
					</div>
					{isSignedIn && session.user ? (
						<Link href={"/dashboard" as Route}>
							<Button variant="default" size="sm">
								Dashboard
							</Button>
						</Link>
					) : (
						<>
							<Link href={"/sign-in" as Route}>
								<Button size="sm" variant="outline">
									Anmelden
								</Button>
							</Link>
							<Link href={"/sign-up" as Route}>
								<Button size="sm">Registrieren</Button>
							</Link>
						</>
					)}
				</div>
				<MobileNav session={session} />
			</nav>
		</header>
	);
}

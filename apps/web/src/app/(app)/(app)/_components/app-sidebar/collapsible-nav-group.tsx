"use client";

import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NavButton } from "./nav-button";

interface SubTab {
	title: string;
	/** Full path for this sub-item */
	href: string;
	icon?: ReactNode;
}

interface CollapsibleNavGroupProps {
	/** Path this group "owns" — used to route the dropdown items */
	href: string;
	icon: ReactNode;
	title: string;
	isOpen: boolean;
	onToggle: () => void;
	subTabs: SubTab[];
}

export function CollapsibleNavGroup({
	href,
	icon,
	title,
	isOpen,
	onToggle,
	subTabs,
}: CollapsibleNavGroupProps) {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";
	const [dropdownOpen, setDropdownOpen] = useState(false);

	// When sidebar is icon-only, show a flyout dropdown instead
	if (isCollapsed) {
		return (
			<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
				{/* No asChild — DropdownMenuTrigger renders its own button internally.
				    We manage open state manually so we can wrap our visual button
				    in a Tooltip without the two components fighting over the element. */}
				<DropdownMenuTrigger className="sr-only" />
				<Tooltip>
					<TooltipTrigger
						render={
							<AnimateIcon animateOnHover asChild>
								<button
									type="button"
									onClick={() => setDropdownOpen(true)}
									className={cn(
										"relative flex h-7 w-full cursor-pointer items-center justify-center",
										"rounded-sm border border-transparent",
										"text-muted-foreground transition-all duration-100",
										"hover:bg-sidebar-accent hover:text-foreground",
									)}
								>
									<span className="flex size-4 shrink-0 items-center justify-center">
										{icon}
									</span>
								</button>
							</AnimateIcon>
						}
					/>
					<TooltipPopup side="right" sideOffset={8}>
						{title}
					</TooltipPopup>
				</Tooltip>
				<DropdownMenuContent
					side="right"
					align="start"
					sideOffset={6}
					className="min-w-40 rounded-xl p-1 shadow-lg"
				>
					{subTabs.map((subTab) => (
						<DropdownMenuItem key={subTab.href} asChild>
							<Link
								href={subTab.href as Route}
								prefetch
								className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
								onClick={() => setDropdownOpen(false)}
							>
								{subTab.icon && (
									<span className="flex size-4 shrink-0 items-center justify-center">
										{subTab.icon}
									</span>
								)}
								{subTab.title}
							</Link>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<div>
			{/* Group header — acts as a toggle button */}
			<NavButton
				href={href}
				icon={icon}
				title={title}
				isGroup
				isOpen={isOpen}
				onClick={onToggle}
			/>

			{/* Autumn-style CSS grid-rows height animation — no JS height calculation */}
			<div
				className={cn(
					"grid transition-[grid-template-rows] duration-150 ease-in-out",
					isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div
					className={cn(
						"overflow-hidden",
						"flex flex-col gap-1",
						"ml-4 border-sidebar-border/60 border-l pl-0",
						"transition-[opacity,margin] duration-150",
						isOpen ? "my-1 opacity-100" : "my-0 opacity-0",
					)}
				>
					{subTabs.map((subTab) => (
						<NavButton
							key={subTab.href}
							href={subTab.href}
							icon={subTab.icon}
							title={subTab.title}
							isSubNav
						/>
					))}
				</div>
			</div>
		</div>
	);
}

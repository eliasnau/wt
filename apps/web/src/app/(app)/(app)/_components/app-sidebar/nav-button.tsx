"use client";

import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NavButtonProps {
	href: string;
	icon?: React.ReactNode;
	title: string;
	/** Exact match — use for root pages like /dashboard */
	exact?: boolean;
	/** External link — new tab, never active */
	external?: boolean;
	/** Renders as <button> instead of <Link> (for group toggles) */
	isGroup?: boolean;
	onClick?: () => void;
	/** Show the open/close chevron */
	isOpen?: boolean;
	/** Sub-nav — right-side-only radius, attaches to left border line */
	isSubNav?: boolean;
	className?: string;
}

export function NavButton({
	href,
	icon,
	title,
	exact = false,
	external = false,
	isGroup = false,
	onClick,
	isOpen,
	isSubNav = false,
	className,
}: NavButtonProps) {
	const pathname = usePathname();
	const { state } = useSidebar();
	const expanded = state === "expanded";

	const isActive =
		!external &&
		!isGroup &&
		(exact ? pathname === href : Boolean(pathname?.startsWith(href)));

	const baseClass = cn(
		"flex h-7 w-full cursor-pointer items-center rounded-sm border border-transparent px-2 font-medium text-muted-foreground text-sm",
		"hover:text-foreground",
		isActive && "!text-foreground border-border bg-sidebar-active shadow-xs",
		isSubNav &&
			"rounded-none rounded-tr-sm rounded-br-sm border-l-0 pl-4 font-normal",
		className,
	);

	const innerContent = (
		<>
			<div className="flex items-center gap-2">
				{icon && (
					<div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm">
						{icon}
					</div>
				)}
				<span
					className={cn(
						"whitespace-nowrap transition-all duration-150",
						expanded
							? "translate-x-0 opacity-100"
							: "pointer-events-none m-0 w-0 -translate-x-2 p-0 opacity-0",
					)}
				>
					{title}
				</span>
			</div>

			{isOpen !== undefined && (
				<ChevronRight
					size={14}
					className={cn(
						"ml-1 text-muted-foreground/60 transition-all duration-100 ease-in-out",
						isOpen ? "rotate-90" : "rotate-0",
					)}
				/>
			)}
		</>
	);

	const button = isGroup ? (
		<AnimateIcon animateOnHover asChild>
			<button type="button" className={baseClass} onClick={onClick}>
				{innerContent}
			</button>
		</AnimateIcon>
	) : (
		<AnimateIcon animateOnHover asChild>
			<Link
				href={href as Route}
				prefetch={!external}
				target={external ? "_blank" : undefined}
				rel={external ? "noopener noreferrer" : undefined}
				className={baseClass}
			>
				{innerContent}
			</Link>
		</AnimateIcon>
	);

	if (expanded) return <div>{button}</div>;

	return (
		<Tooltip>
			<TooltipTrigger render={button} />
			<TooltipPopup side="right" sideOffset={8}>
				{title}
			</TooltipPopup>
		</Tooltip>
	);
}

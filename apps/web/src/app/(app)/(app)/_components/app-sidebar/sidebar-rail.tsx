"use client";

import * as React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const SidebarRail = React.forwardRef<
	HTMLButtonElement,
	React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
	const { toggleSidebar } = useSidebar();

	return (
		<button
			ref={ref}
			type="button"
			data-sidebar="rail"
			aria-label="Toggle Sidebar"
			tabIndex={-1}
			onClick={toggleSidebar}
			title="Toggle Sidebar"
			className={cn(
				// Base positioning and dimensions
				"absolute z-20 flex w-4 transition-all duration-150 ease-linear",
				// Rounded corners on right side only
				"rounded-r-full",
				// Vertical positioning
				"top-5 bottom-5",
				// Sits on the right edge, half-overlapping
				"right-0 translate-x-1/2",
				// Cursor
				"cursor-w-resize",
				// Visual line using ::after pseudo-element
				"after:absolute after:inset-y-0 after:left-1/2 after:-translate-x-1/2",
				"after:w-[2px]",
				"hover:after:bg-border",
				// Hover background
				"hover:bg-border/10",
				// Focus styles
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2",
				className,
			)}
			{...props}
		/>
	);
});

SidebarRail.displayName = "SidebarRail";

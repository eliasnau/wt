"use client";

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Toolbar({
	className,
	orientation = "horizontal",
	...props
}: ComponentProps<typeof ToolbarPrimitive.Root>) {
	return (
		<ToolbarPrimitive.Root
			className={cn(
				"inline-flex items-center gap-1 rounded-2xl border border-border/70 bg-background/95 p-1.5 shadow-lg shadow-black/8 backdrop-blur supports-[backdrop-filter]:bg-background/82",
				className,
			)}
			orientation={orientation}
			{...props}
		/>
	);
}

function ToolbarGroup({
	className,
	...props
}: ComponentProps<typeof ToolbarPrimitive.Group>) {
	return (
		<ToolbarPrimitive.Group
			className={cn("flex items-center gap-1", className)}
			{...props}
		/>
	);
}

function ToolbarSeparator({
	className,
	...props
}: ComponentProps<typeof ToolbarPrimitive.Separator>) {
	return (
		<ToolbarPrimitive.Separator
			className={cn("mx-1 h-6 w-px shrink-0 bg-border/80", className)}
			{...props}
		/>
	);
}

const ToolbarButton = ToolbarPrimitive.Button;
const ToolbarLink = ToolbarPrimitive.Link;

export {
	Toolbar,
	ToolbarButton,
	ToolbarGroup,
	ToolbarLink,
	ToolbarSeparator,
};

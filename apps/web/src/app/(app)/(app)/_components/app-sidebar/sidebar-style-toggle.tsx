"use client";

import { Blend, Sparkles } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarStyle } from "./sidebar-style-context";

export function SidebarStyleToggle({
	className,
	...props
}: React.ComponentProps<typeof Button>) {
	const { setStyle, style } = useSidebarStyle();
	const isExperimental = style === "experimental";

	return (
		<Button
			className={cn(
				"rounded-full border-border bg-background shadow-xl ring-1 ring-black/5 dark:ring-white/10",
				className,
			)}
			onClick={() => setStyle(isExperimental ? "legacy" : "experimental")}
			size="sm"
			variant="outline"
			{...props}
		>
			{isExperimental ? (
				<Blend className="size-3.5" />
			) : (
				<Sparkles className="size-3.5" />
			)}
			<span>
				{isExperimental ? "Use Current Sidebar" : "Try New Sidebar"}
			</span>
		</Button>
	);
}

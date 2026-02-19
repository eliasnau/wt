"use client";

import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "../animate-ui/primitives/base/tooltip";

const TooltipProvider = TooltipPrimitive.TooltipProvider;

const TooltipTrigger = TooltipPrimitive.TooltipTrigger;

function Tooltip({
	delay,
	children,
	...props
}: TooltipPrimitive.TooltipProps & {
	delay?: number;
	children: React.ReactNode;
}) {
	if (delay !== undefined) {
		return (
			<TooltipPrimitive.TooltipProvider delay={delay}>
				<TooltipPrimitive.Tooltip {...props}>
					{children}
				</TooltipPrimitive.Tooltip>
			</TooltipPrimitive.TooltipProvider>
		);
	}

	return (
		<TooltipPrimitive.Tooltip {...props}>{children}</TooltipPrimitive.Tooltip>
	);
}

function TooltipPopup({
	className,
	align = "center",
	sideOffset = 4,
	side = "top",
	children,
	...props
}: TooltipPrimitive.TooltipPopupProps & {
	align?: TooltipPrimitive.TooltipPositionerProps["align"];
	side?: TooltipPrimitive.TooltipPositionerProps["side"];
	sideOffset?: TooltipPrimitive.TooltipPositionerProps["sideOffset"];
}) {
	return (
		<TooltipPrimitive.TooltipPortal>
			<TooltipPrimitive.TooltipPositioner
				align={align}
				className="z-50"
				side={side}
				sideOffset={sideOffset}
			>
				<TooltipPrimitive.TooltipPopup
					className={cn(
						"rounded-md border bg-popover px-3 py-1.5 text-popover-foreground text-xs shadow-md",
						className,
					)}
					{...props}
				>
					{children}
				</TooltipPrimitive.TooltipPopup>
			</TooltipPrimitive.TooltipPositioner>
		</TooltipPrimitive.TooltipPortal>
	);
}

export {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipPopup,
	TooltipPopup as TooltipContent,
};

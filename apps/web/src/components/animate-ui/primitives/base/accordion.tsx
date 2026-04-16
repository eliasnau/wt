"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { motion, type HTMLMotionProps, type Transition } from "motion/react";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
	return (
		<AccordionPrimitive.Root
			className={cn("flex w-full flex-col", className)}
			data-slot="accordion"
			{...props}
		/>
	);
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
	return (
		<AccordionPrimitive.Item
			className={cn("not-last:border-b", className)}
			data-slot="accordion-item"
			{...props}
		/>
	);
}

function AccordionHeader({
	className,
	...props
}: AccordionPrimitive.Header.Props) {
	return (
		<AccordionPrimitive.Header
			className={cn("flex", className)}
			data-slot="accordion-header"
			{...props}
		/>
	);
}

function AccordionTrigger({
	className,
	children,
	...props
}: AccordionPrimitive.Trigger.Props) {
	return (
		<AccordionPrimitive.Trigger
			className={cn(
				"group/accordion-trigger relative flex flex-1 items-start justify-between rounded-md border border-transparent py-4 text-left font-medium text-sm outline-none transition-all hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
				className,
			)}
			data-slot="accordion-trigger"
			{...props}
		>
			{children}
			<ChevronDownIcon
				className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
				data-slot="accordion-trigger-icon"
			/>
			<ChevronUpIcon
				className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
				data-slot="accordion-trigger-icon"
			/>
		</AccordionPrimitive.Trigger>
	);
}

type AccordionPanelProps = Omit<
	AccordionPrimitive.Panel.Props,
	"render" | "keepMounted" | "ref"
> &
	Omit<HTMLMotionProps<"div">, "ref"> & {
		transition?: Transition;
		keepRendered?: boolean;
	};

function AccordionPanel({
	className,
	children,
	transition = { duration: 0.35, ease: "easeInOut" },
	keepRendered: _keepRendered = false,
	style,
	...props
}: AccordionPanelProps) {
	return (
		<AccordionPrimitive.Panel
			data-slot="accordion-panel"
			keepMounted
			render={(renderProps, state) => {
				const { hidden: _hidden, style: renderStyle, ...restRenderProps } =
					renderProps as React.HTMLAttributes<HTMLDivElement>;

				return (
					<motion.div
						{...restRenderProps}
						aria-hidden={!state.open}
						animate={{
							height: state.open ? "auto" : 0,
							opacity: state.open ? 1 : 0,
						}}
						className="overflow-hidden text-sm"
						initial={false}
						style={{
							...(renderStyle as React.CSSProperties),
							pointerEvents: state.open ? "auto" : "none",
							...style,
						}}
						transition={transition}
					>
						<div
							className={cn(
								"h-full [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
								className,
							)}
						>
							{children}
						</div>
					</motion.div>
				);
			}}
			{...props}
		/>
	);
}

export {
	Accordion,
	AccordionItem,
	AccordionHeader,
	AccordionTrigger,
	AccordionPanel,
	type AccordionPanelProps,
};

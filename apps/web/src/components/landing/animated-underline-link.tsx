"use client";

import type * as React from "react";
import { LazyMotion, domAnimation, m, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type AnimatedUnderlineLinkProps = Omit<HTMLMotionProps<"a">, "children"> & {
	children?: React.ReactNode;
};

export function AnimatedUnderlineLink({
	children,
	className,
	...props
}: AnimatedUnderlineLinkProps) {
	return (
		<LazyMotion features={domAnimation}>
			<m.a
				animate="rest"
				className={cn(
					"relative inline-block w-fit font-medium text-lg hover:text-primary",
					className,
				)}
				initial="rest"
				whileFocus="hover"
				whileHover="hover"
				{...props}
			>
				<span>{children}</span>
				<m.span
					aria-hidden="true"
					className="absolute right-0 bottom-0 left-0 h-px origin-left bg-current"
					variants={{
						rest: { scaleX: 0 },
						hover: { scaleX: 1 },
					}}
					transition={{ duration: 0.24, ease: "easeOut" }}
				/>
			</m.a>
		</LazyMotion>
	);
}

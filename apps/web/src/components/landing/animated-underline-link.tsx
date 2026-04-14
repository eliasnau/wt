"use client";

import type * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type AnimatedUnderlineLinkProps = React.ComponentProps<"a">;

export function AnimatedUnderlineLink({
	children,
	className,
	...props
}: AnimatedUnderlineLinkProps) {
	return (
		<motion.a
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
			<motion.span
				aria-hidden="true"
				className="absolute right-0 bottom-0 left-0 h-px origin-left bg-current"
				variants={{
					rest: { scaleX: 0 },
					hover: { scaleX: 1 },
				}}
				transition={{ duration: 0.24, ease: "easeOut" }}
			/>
		</motion.a>
	);
}

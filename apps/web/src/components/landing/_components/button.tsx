import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "secondary-two";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	variant?: ButtonVariant;
	className?: string;
	size?: "md" | "lg" | "xl";
	auto?: boolean;
	asChild?: boolean;
}

export function Button({
	auto = false,
	children,
	variant = "primary",
	className,
	size = "md",
	asChild = false,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot : "button";
	const type = props.type ?? "button";

	const buttonVariants = cva(
		[
			"rounded-[13px] font-medium transition-all will-change-transform",
			"flex items-center justify-center gap-2",
			variant === "primary" ? "" : "hover:scale-[1.04]",
		],
		{
			variants: {
				variant: {
					primary: [
						"button-gradient-border bg-gradient-to-b from-[#2965EC] to-[#5C89F8] text-white shadow-[0px_2px_10.1px_0px_#4B83FD33] hover:shadow-[0px_2px_10.1px_0px_#4B83FD44]",
						"relative z-10 overflow-hidden",
						"before:absolute before:inset-0 before:z-0 before:bg-gradient-to-b before:from-[#285EE5] before:to-[#5380F2] before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100",
					],
					secondary:
						"border border-gray-100 bg-white text-gray-800 hover:border-gray-200 hover:bg-gray-50",
					"secondary-two":
						"border border-gray-100 bg-white text-gray-500 shadow-[0px_2px_16px_0px_#00000008] hover:border-gray-200 hover:bg-gray-50 hover:shadow-[0px_2px_16px_0px_#00000015] [&>svg]:text-[#AEAAA8]",
				},
				size: {
					md: "px-4 py-2 text-sm",
					lg: "px-[18px] py-[10.5px] text-sm",
					xl: "px-[22px] py-[11.7px] text-[16px]",
				},
				auto: {
					true: "w-full",
				},
			},
		},
	);

	// For primary variant with gradient border wrapper
	if (variant === "primary") {
		return (
			<div
				className={cn(
					"transition-all duration-200 will-change-transform hover:scale-[1.04]",
					"rounded-[14px] bg-gradient-to-b p-[1px]",
					"from-[#5989F0] to-[#578AFA] hover:from-[#4875d0] hover:to-[#396ecc]",
					auto ? "w-full" : "w-fit",
				)}
			>
				<Comp
					type={type}
					className={buttonVariants({
						variant,
						size,
						className,
						auto,
					})}
					{...props}
				>
					{asChild ? (
						children
					) : (
						<span className="relative z-10">{children}</span>
					)}
				</Comp>
			</div>
		);
	}

	// For secondary variants - simpler, no wrapper
	return (
		<Comp
			type={type}
			className={buttonVariants({ variant, size, className, auto })}
			{...props}
		>
			{children}
		</Comp>
	);
}

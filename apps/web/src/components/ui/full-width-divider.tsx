import { cn } from "@/lib/utils";

export function FullWidthDivider({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"absolute left-1/2 h-px w-screen -translate-x-1/2 bg-border",
				className,
			)}
			{...props}
		/>
	);
}

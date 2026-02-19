interface SystemBannerProps {
	text?: string;
	color?: string;
	size?: "xs" | "sm" | "md" | "lg";
	show?: boolean;
}

const sizeClasses: Record<NonNullable<SystemBannerProps["size"]>, string> = {
	xs: "text-[10px] px-1 py-0.5",
	sm: "text-xs px-2 py-0.5",
	md: "text-sm px-3 py-1",
	lg: "text-base px-4 py-1.5",
};

export function SystemBanner({
	text = "Development Mode",
	color = "bg-orange-500",
	size = "xs",
	show = true,
}: SystemBannerProps) {
	if (!show) return null;
	return (
		<div
			className={`fixed top-0 left-0 z-50 flex h-0.5 w-full justify-center ${typeof color === "string" && color.startsWith("#") ? "" : color}
        `}
			style={
				typeof color === "string" && color.startsWith("#")
					? { backgroundColor: color }
					: undefined
			}
		>
			<span
				className={`absolute -bottom-4 rounded font-bold text-white shadow-md ${sizeClasses[size]}
            ${typeof color === "string" && color.startsWith("#") ? "" : color}
          `}
				style={
					typeof color === "string" && color.startsWith("#")
						? { backgroundColor: color }
						: undefined
				}
			>
				{text}
			</span>
		</div>
	);
}

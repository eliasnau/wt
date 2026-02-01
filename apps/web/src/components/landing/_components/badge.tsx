import { cva } from "class-variance-authority";

export type BadgeVariant =
	| "blue"
	| "purple"
	| "dark-blue"
	| "green"
	| "yellow"
	| "brown"
	| "red"
	| "light-blue"
	| "orange"
	| "pink"
	| "gray"
	| "dark-gray";

interface BadgeProps {
	children: React.ReactNode;
	variant?: BadgeVariant;
	icon?: React.ReactNode;
	size?: "sm" | "md";
}

export function Badge({
	children,
	variant = "blue",
	icon,
	size = "md",
}: BadgeProps) {
	const badgeOuterStyle = cva(
		"h-fit w-fit shrink-0 rounded-[8px] bg-gradient-to-b p-[1px] font-medium",
		{
			variants: {
				variant: {
					blue: "from-blue-100 to-blue-200 text-blue-600 shadow-[0px_2px_3.4px_0px_rgba(37,99,235,0.1),0px_1px_1px_0px_rgba(37,99,235,0.2)]",
					purple:
						"from-purple-200 to-purple-300 text-purple-600 shadow-[0px_2px_3.4px_0px_rgba(147,51,234,0.1),0px_1px_1px_0px_rgba(147,51,234,0.2)]",
					"dark-blue":
						"from-indigo-100 to-indigo-200 text-indigo-600 shadow-[0px_2px_3.4px_0px_rgba(79,70,229,0.1),0px_1px_1px_0px_rgba(79,70,229,0.2)]",
					green:
						"from-green-100 to-green-200 text-green-600 shadow-[0px_2px_3.4px_0px_rgba(22,163,74,0.1),0px_1px_1px_0px_rgba(22,163,74,0.2)]",
					yellow:
						"from-yellow-100 to-yellow-200 text-yellow-600 shadow-[0px_2px_3.4px_0px_rgba(202,138,4,0.1),0px_1px_1px_0px_rgba(202,138,4,0.2)]",
					brown:
						"from-orange-100 to-orange-200 text-orange-800 shadow-[0px_2px_3.4px_0px_rgba(154,52,18,0.1),0px_1px_1px_0px_rgba(154,52,18,0.2)]",
					red: "from-red-100 to-red-200 text-red-600 shadow-[0px_2px_3.4px_0px_rgba(220,38,38,0.1),0px_1px_1px_0px_rgba(220,38,38,0.2)]",
					"light-blue":
						"from-cyan-100 to-cyan-200 text-cyan-600 shadow-[0px_2px_3.4px_0px_rgba(8,145,178,0.1),0px_1px_1px_0px_rgba(8,145,178,0.2)]",
					orange:
						"from-orange-100 to-orange-200 text-orange-600 shadow-[0px_2px_3.4px_0px_rgba(234,88,12,0.1),0px_1px_1px_0px_rgba(234,88,12,0.2)]",
					pink: "from-pink-100 to-pink-200 text-pink-600 shadow-[0px_2px_3.4px_0px_rgba(219,39,119,0.1),0px_1px_1px_0px_rgba(219,39,119,0.2)]",
					gray: "from-gray-100 to-gray-200 text-gray-600 shadow-[0px_2px_3.4px_0px_rgba(75,85,99,0.1),0px_1px_1px_0px_rgba(75,85,99,0.2)]",
					"dark-gray":
						"from-gray-200 to-gray-300 text-gray-700 shadow-[0px_2px_3.4px_0px_rgba(55,65,81,0.1),0px_1px_1px_0px_rgba(55,65,81,0.2)]",
				},
			},
		},
	);

	const badgeInnerStyle = cva(
		"flex h-fit w-fit items-center gap-1 rounded-[7px] bg-gradient-to-b px-2 py-0.5 font-medium",
		{
			variants: {
				variant: {
					blue: "from-blue-50 to-blue-100",
					purple: "from-purple-50 to-purple-100",
					"dark-blue": "from-indigo-50 to-indigo-100",
					green: "from-green-50 to-green-100",
					yellow: "from-yellow-50 to-yellow-100",
					brown: "from-orange-50 to-orange-100",
					red: "from-red-50 to-red-100",
					"light-blue": "from-cyan-50 to-cyan-100",
					orange: "from-orange-50 to-orange-100",
					pink: "from-pink-50 to-pink-100",
					gray: "from-gray-50 to-gray-100",
					"dark-gray": "from-gray-100 to-gray-200",
				},
			},
		},
	);

	const badgeTextStyle = cva("text-xs", {
		variants: {
			size: {
				sm: "font-bold text-[9px]",
				md: "text-xs",
			},
		},
	});

	return (
		<div className={badgeOuterStyle({ variant })}>
			<div className={badgeInnerStyle({ variant })}>
				{icon || null}
				<p className={badgeTextStyle({ size })}>{children}</p>
			</div>
		</div>
	);
}

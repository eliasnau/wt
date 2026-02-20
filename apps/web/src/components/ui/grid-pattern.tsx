import { cn } from "@/lib/utils";

interface GridPatternProps extends React.ComponentProps<"svg"> {
	width?: number;
	height?: number;
	x?: number;
	y?: number;
	squares?: [number, number][];
	strokeDasharray?: string;
}

export function GridPattern({
	width = 40,
	height = 40,
	x = -1,
	y = -1,
	strokeDasharray,
	squares,
	className,
	...props
}: GridPatternProps) {
	const id = `grid-pattern-${width}-${height}`;

	return (
		<svg
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute inset-0 size-full fill-foreground/5 stroke-foreground/10",
				className,
			)}
			{...props}
		>
			<defs>
				<pattern
					id={id}
					width={width}
					height={height}
					patternUnits="userSpaceOnUse"
					x={x}
					y={y}
				>
					<path
						d={`M.5 ${height}V.5H${width}`}
						fill="none"
						strokeDasharray={strokeDasharray}
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#${id})`} strokeWidth={0} />
			{squares?.map(([sqX, sqY]) => (
				<rect
					key={`${sqX}-${sqY}`}
					width={width - 1}
					height={height - 1}
					x={sqX * width + 1}
					y={sqY * height + 1}
					strokeWidth={0}
				/>
			))}
		</svg>
	);
}

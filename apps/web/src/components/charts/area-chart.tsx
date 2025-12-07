import {
	Area,
	AreaChart as RechartsAreaChart,
	CartesianGrid,
	XAxis,
} from "recharts";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface AreaChartProps {
	data: any[];
	config: ChartConfig;
	dataKeys: string[];
	xAxisKey?: string;
	height?: string;
	stacked?: boolean;
}

export function AreaChart({
	data,
	config,
	dataKeys,
	xAxisKey = "month",
	height = "h-[300px]",
	stacked = false,
}: AreaChartProps) {
	return (
		<ChartContainer config={config} className={`${height} w-full`}>
			<RechartsAreaChart accessibilityLayer data={data}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis
					dataKey={xAxisKey}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) =>
						typeof value === "string" && value.length > 3
							? value.slice(0, 3)
							: value
					}
				/>
				<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
				<defs>
					{dataKeys.map((key) => (
						<linearGradient
							key={key}
							id={`gradient-${key}`}
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset="5%"
								stopColor={`var(--color-${key})`}
								stopOpacity={0.5}
							/>
							<stop
								offset="95%"
								stopColor={`var(--color-${key})`}
								stopOpacity={0.1}
							/>
						</linearGradient>
					))}
				</defs>
				{dataKeys.map((key) => (
					<Area
						key={key}
						dataKey={key}
						type="natural"
						fill={`url(#gradient-${key})`}
						fillOpacity={0.4}
						stroke={`var(--color-${key})`}
						strokeWidth={2}
						stackId={stacked ? "a" : undefined}
					/>
				))}
			</RechartsAreaChart>
		</ChartContainer>
	);
}

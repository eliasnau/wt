import {
	Line,
	LineChart as RechartsLineChart,
	CartesianGrid,
	XAxis,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface LineChartProps {
	data: any[];
	config: ChartConfig;
	dataKeys: string[];
	xAxisKey?: string;
	height?: string;
}

export function LineChart({
	data,
	config,
	dataKeys,
	xAxisKey = "month",
	height = "h-[300px]",
}: LineChartProps) {
	return (
		<ChartContainer config={config} className={`${height} w-full`}>
			<RechartsLineChart accessibilityLayer data={data}>
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
				{dataKeys.map((key) => (
					<Line
						key={key}
						dataKey={key}
						type="monotone"
						stroke={`var(--color-${key})`}
						strokeWidth={2}
						dot={false}
					/>
				))}
			</RechartsLineChart>
		</ChartContainer>
	);
}

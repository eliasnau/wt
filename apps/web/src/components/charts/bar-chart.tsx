import {
	Bar,
	CartesianGrid,
	BarChart as RechartsBarChart,
	XAxis,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface BarChartProps {
	data: any[];
	config: ChartConfig;
	dataKeys: string[];
	xAxisKey?: string;
	height?: string;
}

export function BarChart({
	data,
	config,
	dataKeys,
	xAxisKey = "month",
	height = "h-[300px]",
}: BarChartProps) {
	return (
		<ChartContainer config={config} className={`${height} w-full`}>
			<RechartsBarChart accessibilityLayer data={data}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis
					dataKey={xAxisKey}
					tickLine={false}
					tickMargin={10}
					axisLine={false}
					tickFormatter={(value) =>
						typeof value === "string" && value.length > 3
							? value.slice(0, 3)
							: value
					}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="dashed" />}
				/>
				{dataKeys.map((key) => (
					<Bar
						key={key}
						dataKey={key}
						fill={`var(--color-${key})`}
						radius={4}
					/>
				))}
			</RechartsBarChart>
		</ChartContainer>
	);
}

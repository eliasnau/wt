"use client";

import { Pie, PieChart, LabelList } from "recharts";
import { BarChart } from "@/components/charts/bar-chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
	membership: {
		label: "Membership",
		color: "var(--chart-1)",
	},
	joining: {
		label: "Aufnahmegebühr",
		color: "var(--chart-2)",
	},
	yearly: {
		label: "Jahresbeitrag",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

export function FeesBreakdownChart({
	membership,
	joining,
	yearly,
	label,
	chartType,
}: {
	membership: number;
	joining: number;
	yearly: number;
	label: string;
	chartType: "pie" | "bar";
}) {
	const data = [
		{ name: "Membership", value: membership, fill: "var(--color-membership)" },
		{ name: "Aufnahmegebühr", value: joining, fill: "var(--color-joining)" },
		{ name: "Jahresbeitrag", value: yearly, fill: "var(--color-yearly)" },
	];

	const barData = [
		{
			month: label,
			membership,
			joining,
			yearly,
		},
	];

	const total = membership + joining + yearly;

	if (total === 0) {
		return (
			<div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground text-sm">
				No fee data yet.
			</div>
		);
	}

	if (chartType === "bar") {
		return (
			<BarChart
				data={barData}
				config={chartConfig}
				dataKeys={["membership", "joining", "yearly"]}
				xAxisKey="month"
				height="h-[240px]"
			/>
		);
	}

	return (
		<ChartContainer
			config={chartConfig}
			className="[&_.recharts-text]:fill-foreground mx-auto aspect-square max-h-[240px]"
		>
			<PieChart>
				<ChartTooltip
					content={<ChartTooltipContent nameKey="name" hideLabel />}
				/>
				<Pie
					data={data}
					dataKey="value"
					innerRadius={36}
					outerRadius={95}
					paddingAngle={4}
					cornerRadius={8}
				>
					<LabelList
						dataKey="value"
						stroke="none"
						fontSize={11}
						fontWeight={500}
						fill="currentColor"
						formatter={(value: number) => value.toString()}
					/>
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}

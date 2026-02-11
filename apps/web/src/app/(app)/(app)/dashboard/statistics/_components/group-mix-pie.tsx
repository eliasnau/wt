"use client";

import { Pie, PieChart, Cell, LabelList } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
	value: {
		label: "Mitglieder",
	},
} satisfies ChartConfig;

const colorPalette = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function GroupMixPieChart({
	data,
}: {
	data: { name: string; value: number }[];
}) {
	if (!data.length) {
		return (
			<div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground text-sm">
				No group data yet.
			</div>
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
					{data.map((entry, index) => (
						<Cell
							key={`${entry.name}-${index}`}
							fill={colorPalette[index % colorPalette.length]}
						/>
					))}
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

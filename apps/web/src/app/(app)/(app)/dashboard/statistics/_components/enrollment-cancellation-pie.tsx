"use client";

import { Pie, PieChart, LabelList } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
	enrollments: {
		label: "Enrollments",
		color: "var(--chart-1)",
	},
	cancellations: {
		label: "Kündigungen",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export function EnrollmentCancellationPieChart({
	enrollments,
	cancellations,
}: {
	enrollments: number;
	cancellations: number;
}) {
	const data = [
		{
			name: "Enrollments",
			value: enrollments,
			fill: "var(--color-enrollments)",
		},
		{
			name: "Kündigungen",
			value: cancellations,
			fill: "var(--color-cancellations)",
		},
	];

	const total = enrollments + cancellations;

	if (total === 0) {
		return (
			<div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground text-sm">
				No membership flow yet.
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

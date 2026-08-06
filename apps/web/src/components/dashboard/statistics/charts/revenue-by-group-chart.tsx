"use client";

import {
	Bar,
	EvilBarChart,
	Grid,
	Tooltip,
	XAxis,
} from "@/components/evilcharts/charts/bar-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import { ChartEmpty } from "./chart-card";

type RevenueByGroupItem = {
	groupId: string;
	name: string;
	total: string;
};

const config = {
	value: {
		label: "Beitragsumsatz",
		colors: { light: ["#6366f1"], dark: ["#818cf8"] },
	},
} satisfies ChartConfig;

function truncate(value: string, max = 10) {
	return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function RevenueByGroupChart({
	data,
	isLoading,
}: {
	data: RevenueByGroupItem[] | undefined;
	isLoading: boolean;
}) {
	const items = (data ?? [])
		.map((group) => ({
			group: group.name,
			value: Math.round(Number(group.total)),
		}))
		.filter((entry) => Number.isFinite(entry.value) && entry.value > 0);

	if (!isLoading && items.length === 0) {
		return <ChartEmpty message="Noch kein Beitragsumsatz nach Gruppe." />;
	}

	return (
		<div className="h-64">
			<EvilBarChart
				className="aspect-auto h-full w-full"
				data={items}
				config={config}
				isLoading={isLoading}
				loadingBars={6}
				chartProps={{ maxBarSize: 72 }}
			>
				<Grid />
				<XAxis
					dataKey="group"
					tickFormatter={(value) => truncate(String(value))}
				/>
				<Tooltip />
				<Bar dataKey="value" variant="default" />
			</EvilBarChart>
		</div>
	);
}

"use client";

import {
	EvilPieChart,
	Legend,
	Pie,
	Tooltip,
} from "@/components/evilcharts/charts/pie-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import { ChartEmpty } from "./chart-card";

type GroupMixItem = {
	groupId: string;
	name: string;
	color: string | null;
	count: number;
};

/** Theme-aware fallback hues for groups that have no custom color set. */
const FALLBACK_COLORS: { light: string; dark: string }[] = [
	{ light: "#6366f1", dark: "#818cf8" },
	{ light: "#10b981", dark: "#34d399" },
	{ light: "#f59e0b", dark: "#fbbf24" },
	{ light: "#ec4899", dark: "#f472b6" },
	{ light: "#06b6d4", dark: "#22d3ee" },
	{ light: "#8b5cf6", dark: "#a78bfa" },
];

export function MembersByGroupChart({
	data,
	isLoading,
}: {
	data: GroupMixItem[] | undefined;
	isLoading: boolean;
}) {
	const items = (data ?? []).filter((group) => group.count > 0);

	if (!isLoading && items.length === 0) {
		return (
			<ChartEmpty message="Keine Mitglieder in Gruppen in diesem Monat." />
		);
	}

	const chartData = items.map((group) => ({
		key: group.groupId,
		value: group.count,
	}));

	const config: ChartConfig = Object.fromEntries(
		items.map((group, index) => {
			const fallback = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
			return [
				group.groupId,
				{
					label: group.name,
					colors: {
						light: [group.color ?? fallback.light],
						dark: [group.color ?? fallback.dark],
					},
				},
			];
		}),
	);

	return (
		<div className="h-64">
			<EvilPieChart
				className="aspect-auto h-full w-full"
				data={chartData}
				dataKey="value"
				nameKey="key"
				config={config}
				isLoading={isLoading}
			>
				{!isLoading && <Legend isClickable />}
				<Tooltip />
				<Pie isClickable innerRadius="58%" paddingAngle={3} cornerRadius={6} />
			</EvilPieChart>
		</div>
	);
}

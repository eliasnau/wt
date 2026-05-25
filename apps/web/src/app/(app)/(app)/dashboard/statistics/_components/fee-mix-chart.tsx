"use client";

import {
	EvilPieChart,
	Legend,
	Pie,
	Tooltip,
} from "@/components/evilcharts/charts/pie-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import { ChartEmpty } from "./chart-card";

type FeeRevenue = {
	membershipTotal: string;
	joiningFeeTotal: string;
	yearlyFeeTotal: string;
};

const config: ChartConfig = {
	membership: {
		label: "Mitgliedsbeiträge",
		colors: { light: ["#6366f1"], dark: ["#818cf8"] },
	},
	joining: {
		label: "Aufnahmegebühren",
		colors: { light: ["#10b981"], dark: ["#34d399"] },
	},
	yearly: {
		label: "Jahresgebühren",
		colors: { light: ["#f59e0b"], dark: ["#fbbf24"] },
	},
};

export function FeeMixChart({
	data,
	isLoading,
}: {
	data: FeeRevenue | undefined;
	isLoading: boolean;
}) {
	const chartData = [
		{
			key: "membership",
			value: Math.round(Number(data?.membershipTotal ?? 0)),
		},
		{ key: "joining", value: Math.round(Number(data?.joiningFeeTotal ?? 0)) },
		{ key: "yearly", value: Math.round(Number(data?.yearlyFeeTotal ?? 0)) },
	].filter((entry) => Number.isFinite(entry.value));

	const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

	if (!isLoading && total <= 0) {
		return <ChartEmpty message="Noch kein Beitragsumsatz in diesem Monat." />;
	}

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

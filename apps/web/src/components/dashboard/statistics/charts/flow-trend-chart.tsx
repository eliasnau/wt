"use client";

import {
	Bar,
	EvilBarChart,
	Grid,
	Legend,
	Tooltip,
	XAxis,
	YAxis,
} from "@/components/evilcharts/charts/bar-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import { ChartEmpty } from "./chart-card";

const config = {
	enrollments: {
		label: "Anmeldungen",
		colors: { light: ["#059669"], dark: ["#34d399"] },
	},
	cancellations: {
		label: "Kündigungen",
		colors: { light: ["#e11d48"], dark: ["#fb7185"] },
	},
} satisfies ChartConfig;

type FlowTrendChartProps = {
	data: { label: string; enrollments: number; cancellations: number }[];
	isLoading: boolean;
};

/** Zu- und Abgänge per period: new members vs. cancellations over time. */
export function FlowTrendChart({ data, isLoading }: FlowTrendChartProps) {
	if (!isLoading && data.length === 0) {
		return <ChartEmpty message="Keine Zu- oder Abgänge im Zeitraum." />;
	}

	return (
		<div className="h-64">
			<EvilBarChart
				className="aspect-auto h-full w-full"
				data={data}
				config={config}
				isLoading={isLoading}
				loadingBars={Math.max(data.length, 6)}
			>
				<Grid />
				<XAxis dataKey="label" />
				<YAxis />
				<Legend isClickable />
				<Tooltip />
				<Bar dataKey="enrollments" variant="default" isClickable />
				<Bar dataKey="cancellations" variant="default" isClickable />
			</EvilBarChart>
		</div>
	);
}

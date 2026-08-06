"use client";

import {
	Bar,
	EvilBarChart,
	Grid,
	Legend,
	Tooltip,
	XAxis,
} from "@/components/evilcharts/charts/bar-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";

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

export function EnrollmentCancellationChart({
	period,
	enrollments,
	cancellations,
	isLoading,
}: {
	period: string;
	enrollments: number;
	cancellations: number;
	isLoading: boolean;
}) {
	const data = [{ period, enrollments, cancellations }];

	return (
		<div className="h-64">
			<EvilBarChart
				className="aspect-auto h-full w-full"
				data={data}
				config={config}
				isLoading={isLoading}
				loadingBars={6}
				chartProps={{ maxBarSize: 72 }}
			>
				<Grid />
				<XAxis dataKey="period" />
				<Legend isClickable />
				<Tooltip />
				<Bar dataKey="enrollments" variant="default" isClickable />
				<Bar dataKey="cancellations" variant="default" isClickable />
			</EvilBarChart>
		</div>
	);
}

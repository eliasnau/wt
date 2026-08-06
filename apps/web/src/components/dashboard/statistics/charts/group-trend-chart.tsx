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

const numberAxis = new Intl.NumberFormat("de-DE", {
	notation: "compact",
	maximumFractionDigits: 1,
});
const currencyAxis = new Intl.NumberFormat("de-DE", {
	notation: "compact",
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 1,
});

type GroupSeries = { key: string; label: string; color: string };

type GroupTrendChartProps = {
	data: Record<string, string | number>[];
	series: GroupSeries[];
	valueFormat?: "number" | "currency";
	isLoading: boolean;
	emptyMessage?: string;
};

/** Stacked bars over time, one stack segment per group (members or revenue). */
export function GroupTrendChart({
	data,
	series,
	valueFormat = "number",
	isLoading,
	emptyMessage,
}: GroupTrendChartProps) {
	if (!isLoading && (data.length === 0 || series.length === 0)) {
		return <ChartEmpty message={emptyMessage} />;
	}

	const config: ChartConfig = Object.fromEntries(
		series.map((entry) => [
			entry.key,
			{
				label: entry.label,
				colors: { light: [entry.color], dark: [entry.color] },
			},
		]),
	);

	const formatter = valueFormat === "currency" ? currencyAxis : numberAxis;

	return (
		<div className="h-64">
			<EvilBarChart
				className="aspect-auto h-full w-full"
				data={data}
				config={config}
				stackType="stacked"
				isLoading={isLoading}
				loadingBars={Math.max(data.length, 6)}
			>
				<Grid />
				<XAxis dataKey="label" />
				<YAxis tickFormatter={(value) => formatter.format(Number(value))} />
				<Legend isClickable />
				<Tooltip />
				{series.map((entry) => (
					<Bar
						key={entry.key}
						dataKey={entry.key}
						variant="default"
						isClickable
					/>
				))}
			</EvilBarChart>
		</div>
	);
}

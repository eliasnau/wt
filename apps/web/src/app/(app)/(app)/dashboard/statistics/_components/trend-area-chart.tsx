"use client";

import {
	Area,
	EvilAreaChart,
	Grid,
	Tooltip,
	XAxis,
	YAxis,
} from "@/components/evilcharts/charts/area-chart";
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

type TrendAreaChartProps = {
	data: { label: string; value: number }[];
	seriesLabel: string;
	color: { light: string; dark: string };
	valueFormat?: "number" | "currency";
	isLoading: boolean;
	emptyMessage?: string;
};

/** Single-series trend curve over time (active members, revenue, …). */
export function TrendAreaChart({
	data,
	seriesLabel,
	color,
	valueFormat = "number",
	isLoading,
	emptyMessage,
}: TrendAreaChartProps) {
	if (!isLoading && data.length === 0) {
		return <ChartEmpty message={emptyMessage} />;
	}

	const config = {
		value: {
			label: seriesLabel,
			colors: { light: [color.light], dark: [color.dark] },
		},
	} satisfies ChartConfig;

	const formatter = valueFormat === "currency" ? currencyAxis : numberAxis;

	return (
		<div className="h-64">
			<EvilAreaChart
				className="aspect-auto h-full w-full"
				data={data}
				config={config}
				curveType="monotone"
				isLoading={isLoading}
				loadingPoints={Math.max(data.length, 8)}
			>
				<Grid />
				<XAxis dataKey="label" />
				<YAxis tickFormatter={(value) => formatter.format(Number(value))} />
				<Tooltip />
				<Area dataKey="value" variant="gradient" strokeVariant="solid" />
			</EvilAreaChart>
		</div>
	);
}

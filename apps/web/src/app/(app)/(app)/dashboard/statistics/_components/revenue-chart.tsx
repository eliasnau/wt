"use client";

import {
	AreaChartIcon,
	BarChartIcon,
	InfoIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Button } from "@/components/ui/button";
import type { ChartConfig } from "@/components/ui/chart";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/ui/frame";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ChartType = "area" | "bar";

type RevenueChartSeries = {
	key: string;
	label: string;
	color: string;
};

interface RevenueChartProps {
	data: Array<Record<string, string | number>>;
	series: RevenueChartSeries[];
	isPending?: boolean;
}

export function RevenueChart({
	data,
	series,
	isPending = false,
}: RevenueChartProps) {
	const [chartType, setChartType] = useState<ChartType>("area");
	const chartData = data;
	const dataKeys = useMemo(() => series.map((entry) => entry.key), [series]);
	const chartConfig = useMemo(
		() =>
			series.reduce<ChartConfig>((config, entry) => {
				config[entry.key] = {
					label: entry.label,
					color: entry.color,
				};
				return config;
			}, {}),
		[series],
	);
	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>Umsatz pro Gruppe</FrameTitle>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button variant="ghost" size="sm" className="h-5 w-5 p-0" />
								}
							>
								<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								Zeigt, welche Gruppen den meisten Umsatz beitragen. So lassen
								sich starke Gruppen und Entwicklungspotenziale schnell erkennen.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>Umsatzverteilung nach Gruppen</FrameDescription>
				</div>
				<div className="flex gap-1 rounded-lg border p-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setChartType("area")}
						className={cn("h-7 px-2", chartType === "area" && "bg-muted")}
					>
						<AreaChartIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setChartType("bar")}
						className={cn("h-7 px-2", chartType === "bar" && "bg-muted")}
					>
						<BarChartIcon className="h-4 w-4" />
					</Button>
				</div>
			</FrameHeader>
			<FramePanel>
				{chartType === "area" ? (
					<AreaChart
						data={chartData}
						config={chartConfig}
						dataKeys={dataKeys}
						stacked
					/>
				) : (
					<BarChart data={chartData} config={chartConfig} dataKeys={dataKeys} />
				)}
			</FramePanel>
		</Frame>
	);
}

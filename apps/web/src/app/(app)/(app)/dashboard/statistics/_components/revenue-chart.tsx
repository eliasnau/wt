"use client";

import {
	AreaChartIcon,
	BarChartIcon,
	InfoIcon,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Badge } from "@/components/ui/badge";
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
	const monthTotals = useMemo(() => {
		return chartData.map((entry) =>
			dataKeys.reduce(
				(total, key) => total + Number((entry[key] as number | undefined) ?? 0),
				0,
			),
		);
	}, [chartData, dataKeys]);
	const hasComparison = monthTotals.length > 1;
	const lastTotal = monthTotals.at(-1) ?? 0;
	const previousTotal = monthTotals.at(-2) ?? 0;
	const changePercent = hasComparison
		? previousTotal === 0
			? lastTotal === 0
				? 0
				: 100
			: ((lastTotal - previousTotal) / Math.abs(previousTotal)) * 100
		: 0;
	const isPositive = changePercent >= 0;
	const trendClass = isPositive
		? "ml-2 border-none bg-green-500/10 text-green-500"
		: "ml-2 border-none bg-red-500/10 text-red-500";
	const trendText = hasComparison
		? `${isPositive ? "+" : ""}${changePercent.toFixed(1)}%`
		: "—";

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>
							Revenue per Group
							<Badge variant="outline" className={trendClass}>
								{isPositive ? (
									<TrendingUp className="h-4 w-4" />
								) : (
									<TrendingDown className="h-4 w-4" />
								)}
								<span>{isPending ? "…" : trendText}</span>
							</Badge>
						</FrameTitle>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button variant="ghost" size="sm" className="h-5 w-5 p-0" />
								}
							>
								<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								Breaks down revenue by activity group, showing which groups
								contribute most to your organization's income. Useful for
								identifying high-performing groups and areas for growth.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>
						Revenue breakdown by activity group
					</FrameDescription>
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

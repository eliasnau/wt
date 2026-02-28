"use client";

import {
	AreaChartIcon,
	BarChartIcon,
	InfoIcon,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
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

const chartConfig = {
	total: {
		label: "Mitglieder gesamt",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

type ChartType = "area" | "bar";

export type TotalMembersChartData = {
	month: string;
	total: number;
};

interface TotalMembersChartProps {
	data: TotalMembersChartData[];
	isPending?: boolean;
}

export function TotalMembersChart({
	data,
	isPending = false,
}: TotalMembersChartProps) {
	const [chartType, setChartType] = useState<ChartType>("area");
	const chartData = data;
	const firstValue = chartData[0]?.total ?? 0;
	const lastValue = chartData.at(-1)?.total ?? 0;
	const hasData = chartData.length > 1;
	const changePercent = hasData
		? firstValue === 0
			? lastValue === 0
				? 0
				: 100
			: ((lastValue - firstValue) / Math.abs(firstValue)) * 100
		: 0;
	const isPositive = changePercent >= 0;
	const trendClass = isPositive
		? "ml-2 border-none bg-green-500/10 text-green-500"
		: "ml-2 border-none bg-red-500/10 text-red-500";
	const trendText = hasData
		? `${isPositive ? "+" : ""}${changePercent.toFixed(1)}%`
		: "—";

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>
							Total Members
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
								Shows the cumulative total number of active members over time.
								This metric reflects your organization's overall membership
								growth trajectory.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>
						Total member count growth over time
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
						dataKeys={["total"]}
					/>
				) : (
					<BarChart
						data={chartData}
						config={chartConfig}
						dataKeys={["total"]}
					/>
				)}
			</FramePanel>
		</Frame>
	);
}

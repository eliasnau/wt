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
	newMembers: {
		label: "Neue Mitglieder",
		color: "var(--chart-1)",
	},
	cancellations: {
		label: "Kündigungen",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

type ChartType = "area" | "bar";

export type MembershipChartData = {
	month: string;
	newMembers: number;
	cancellations: number;
};

interface MembershipChartProps {
	data: MembershipChartData[];
	isPending?: boolean;
}

export function MembershipChart({
	data,
	isPending = false,
}: MembershipChartProps) {
	const [chartType, setChartType] = useState<ChartType>("area");
	const chartData = data;

	const lastMonth = chartData.at(-1);
	const previousMonth = chartData.at(-2);
	const netChange =
		(lastMonth?.newMembers ?? 0) - (lastMonth?.cancellations ?? 0);
	const previousNetChange =
		(previousMonth?.newMembers ?? 0) - (previousMonth?.cancellations ?? 0);
	const hasComparison = Boolean(lastMonth && previousMonth);
	const changePercent = hasComparison
		? previousNetChange === 0
			? netChange === 0
				? 0
				: 100
			: ((netChange - previousNetChange) / Math.abs(previousNetChange)) * 100
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
							Membership Overview
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
								Tracks the number of new member registrations versus membership
								cancellations over time. The percentage shows the net change in
								membership growth compared to the previous period.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>
						New members and cancellations over the selected period
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
						dataKeys={["cancellations", "newMembers"]}
						stacked
					/>
				) : (
					<BarChart
						data={chartData}
						config={chartConfig}
						dataKeys={["newMembers", "cancellations"]}
					/>
				)}
			</FramePanel>
		</Frame>
	);
}

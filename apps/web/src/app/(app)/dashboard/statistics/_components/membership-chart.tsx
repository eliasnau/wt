"use client";

import { useState } from "react";
import {
	Frame,
	FramePanel,
	FrameHeader,
	FrameTitle,
	FrameDescription,
} from "@/components/ui/frame";
import type { ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
	TrendingDown,
	TrendingUp,
	AreaChartIcon,
	BarChartIcon,
	InfoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";

const chartData = [
	{ month: "January", newMembers: 45, cancellations: 12 },
	{ month: "February", newMembers: 67, cancellations: 8 },
	{ month: "March", newMembers: 52, cancellations: 15 },
	{ month: "April", newMembers: 78, cancellations: 10 },
	{ month: "May", newMembers: 61, cancellations: 18 },
	{ month: "June", newMembers: 89, cancellations: 9 },
	{ month: "July", newMembers: 43, cancellations: 22 },
	{ month: "August", newMembers: 95, cancellations: 7 },
	{ month: "September", newMembers: 72, cancellations: 14 },
	{ month: "October", newMembers: 58, cancellations: 11 },
	{ month: "November", newMembers: 87, cancellations: 13 },
	{ month: "December", newMembers: 65, cancellations: 19 },
];

const chartConfig = {
	newMembers: {
		label: "New Members",
		color: "var(--chart-1)",
	},
	cancellations: {
		label: "Cancellations",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

type ChartType = "area" | "bar";

export function MembershipChart() {
	const [chartType, setChartType] = useState<ChartType>("area");

	const lastMonth = chartData[chartData.length - 1];
	const previousMonth = chartData[chartData.length - 2];
	const netChange = lastMonth.newMembers - lastMonth.cancellations;
	const previousNetChange =
		previousMonth.newMembers - previousMonth.cancellations;
	const changePercent = (
		((netChange - previousNetChange) / previousNetChange) *
		100
	).toFixed(1);
	const isPositive = parseFloat(changePercent) >= 0;

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>
							Membership Overview
							<Badge
								variant="outline"
								className={
									isPositive
										? "text-green-500 bg-green-500/10 border-none ml-2"
										: "text-red-500 bg-red-500/10 border-none ml-2"
								}
							>
								{isPositive ? (
									<TrendingUp className="h-4 w-4" />
								) : (
									<TrendingDown className="h-4 w-4" />
								)}
								<span>
									{isPositive ? "+" : ""}
									{changePercent}%
								</span>
							</Badge>
						</FrameTitle>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="sm" className="h-5 w-5 p-0">
									<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
								</Button>
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
				<div className="flex gap-1 border rounded-lg p-1">
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

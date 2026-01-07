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
	{ month: "Jan", total: 1215 },
	{ month: "Feb", total: 1248 },
	{ month: "Mar", total: 1285 },
	{ month: "Apr", total: 1312 },
	{ month: "May", total: 1355 },
	{ month: "Jun", total: 1398 },
	{ month: "Jul", total: 1419 },
	{ month: "Aug", total: 1467 },
	{ month: "Sep", total: 1502 },
	{ month: "Oct", total: 1549 },
	{ month: "Nov", total: 1587 },
	{ month: "Dec", total: 1623 },
];

const chartConfig = {
	total: {
		label: "Total Members",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

type ChartType = "area" | "bar";

export function TotalMembersChart() {
	const [chartType, setChartType] = useState<ChartType>("area");

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>
							Total Members
							<Badge
								variant="outline"
								className="text-green-500 bg-green-500/10 border-none ml-2"
							>
								<TrendingUp className="h-4 w-4" />
								<span>+33.6%</span>
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

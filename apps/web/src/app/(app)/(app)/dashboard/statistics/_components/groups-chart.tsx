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
	LineChartIcon,
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
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";

const chartData = [
	{
		month: "Jan",
		yoga: 45,
		football: 67,
		tennis: 32,
		swimming: 54,
		basketball: 41,
	},
	{
		month: "Feb",
		yoga: 48,
		football: 71,
		tennis: 35,
		swimming: 58,
		basketball: 44,
	},
	{
		month: "Mar",
		yoga: 52,
		football: 68,
		tennis: 38,
		swimming: 61,
		basketball: 47,
	},
	{
		month: "Apr",
		yoga: 55,
		football: 75,
		tennis: 41,
		swimming: 63,
		basketball: 50,
	},
	{
		month: "May",
		yoga: 58,
		football: 73,
		tennis: 39,
		swimming: 66,
		basketball: 53,
	},
	{
		month: "Jun",
		yoga: 61,
		football: 79,
		tennis: 43,
		swimming: 69,
		basketball: 56,
	},
	{
		month: "Jul",
		yoga: 64,
		football: 82,
		tennis: 46,
		swimming: 72,
		basketball: 59,
	},
	{
		month: "Aug",
		yoga: 62,
		football: 85,
		tennis: 44,
		swimming: 75,
		basketball: 62,
	},
	{
		month: "Sep",
		yoga: 67,
		football: 81,
		tennis: 48,
		swimming: 71,
		basketball: 58,
	},
	{
		month: "Oct",
		yoga: 70,
		football: 88,
		tennis: 51,
		swimming: 78,
		basketball: 65,
	},
	{
		month: "Nov",
		yoga: 73,
		football: 91,
		tennis: 53,
		swimming: 81,
		basketball: 68,
	},
	{
		month: "Dec",
		yoga: 69,
		football: 87,
		tennis: 49,
		swimming: 77,
		basketball: 64,
	},
];

const chartConfig = {
	yoga: {
		label: "Yoga",
		color: "var(--chart-1)",
	},
	football: {
		label: "Football",
		color: "var(--chart-2)",
	},
	tennis: {
		label: "Tennis",
		color: "var(--chart-3)",
	},
	swimming: {
		label: "Swimming",
		color: "var(--chart-4)",
	},
	basketball: {
		label: "Basketball",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig;

type ChartType = "line" | "bar";

export function GroupsChart() {
	const [chartType, setChartType] = useState<ChartType>("line");

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>
							Members per Group
							<Badge
								variant="outline"
								className="text-green-500 bg-green-500/10 border-none ml-2"
							>
								<TrendingUp className="h-4 w-4" />
								<span>+8.4%</span>
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
								Displays the distribution of members across different activity
								groups. Helps identify which activities are most popular and
								track participation trends in each group.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>
						Member count across different activity groups
					</FrameDescription>
				</div>
				<div className="flex gap-1 border rounded-lg p-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setChartType("line")}
						className={cn("h-7 px-2", chartType === "line" && "bg-muted")}
					>
						<LineChartIcon className="h-4 w-4" />
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
				{chartType === "line" ? (
					<LineChart
						data={chartData}
						config={chartConfig}
						dataKeys={["yoga", "football", "tennis", "swimming", "basketball"]}
					/>
				) : (
					<BarChart
						data={chartData}
						config={chartConfig}
						dataKeys={["yoga", "football", "tennis", "swimming", "basketball"]}
					/>
				)}
			</FramePanel>
		</Frame>
	);
}

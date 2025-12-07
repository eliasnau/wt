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
	{
		month: "Jan",
		yoga: 8500,
		football: 12200,
		tennis: 6100,
		swimming: 9800,
		basketball: 5900,
	},
	{
		month: "Feb",
		yoga: 9100,
		football: 13400,
		tennis: 6600,
		swimming: 10500,
		basketball: 6300,
	},
	{
		month: "Mar",
		yoga: 9800,
		football: 12800,
		tennis: 7200,
		swimming: 11100,
		basketball: 6700,
	},
	{
		month: "Apr",
		yoga: 10500,
		football: 14100,
		tennis: 7800,
		swimming: 11500,
		basketball: 7200,
	},
	{
		month: "May",
		yoga: 11000,
		football: 13800,
		tennis: 7400,
		swimming: 12000,
		basketball: 7600,
	},
	{
		month: "Jun",
		yoga: 11600,
		football: 14900,
		tennis: 8200,
		swimming: 12600,
		basketball: 8100,
	},
	{
		month: "Jul",
		yoga: 12100,
		football: 15400,
		tennis: 8700,
		swimming: 13100,
		basketball: 8500,
	},
	{
		month: "Aug",
		yoga: 11700,
		football: 16000,
		tennis: 8300,
		swimming: 13700,
		basketball: 8900,
	},
	{
		month: "Sep",
		yoga: 12600,
		football: 15200,
		tennis: 9100,
		swimming: 13000,
		basketball: 8400,
	},
	{
		month: "Oct",
		yoga: 13200,
		football: 16500,
		tennis: 9600,
		swimming: 14200,
		basketball: 9300,
	},
	{
		month: "Nov",
		yoga: 13800,
		football: 17100,
		tennis: 10000,
		swimming: 14800,
		basketball: 9800,
	},
	{
		month: "Dec",
		yoga: 13000,
		football: 16300,
		tennis: 9200,
		swimming: 14000,
		basketball: 9200,
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

type ChartType = "area" | "bar";

export function RevenueChart() {
	const [chartType, setChartType] = useState<ChartType>("area");

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>
							Revenue per Group
							<Badge
								variant="outline"
								className="text-green-500 bg-green-500/10 border-none ml-2"
							>
								<TrendingUp className="h-4 w-4" />
								<span>+18.5%</span>
							</Badge>
						</FrameTitle>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="sm" className="h-5 w-5 p-0">
									<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
								</Button>
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
						dataKeys={["yoga", "football", "tennis", "swimming", "basketball"]}
						stacked
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

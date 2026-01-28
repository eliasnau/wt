"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
	Frame,
	FramePanel,
	FrameHeader,
	FrameTitle,
	FrameDescription,
} from "@/components/ui/frame";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
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

const chartData = [
	{ month: "Jan", revenue: 42500 },
	{ month: "Feb", revenue: 45200 },
	{ month: "Mar", revenue: 43800 },
	{ month: "Apr", revenue: 48900 },
	{ month: "May", revenue: 46300 },
	{ month: "Jun", revenue: 51200 },
	{ month: "Jul", revenue: 49800 },
	{ month: "Aug", revenue: 53400 },
	{ month: "Sep", revenue: 50600 },
	{ month: "Oct", revenue: 55100 },
	{ month: "Nov", revenue: 52900 },
	{ month: "Dec", revenue: 58700 },
];

const chartConfig = {
	revenue: {
		label: "Revenue",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

type ChartType = "area" | "bar";

export function TotalRevenueChart() {
	const [chartType, setChartType] = useState<ChartType>("area");

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>
							Total Revenue
							<Badge
								variant="outline"
								className="text-green-500 bg-green-500/10 border-none ml-2"
							>
								<TrendingUp className="h-4 w-4" />
								<span>+38.1%</span>
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
								Shows the total revenue collected from all membership fees and
								payments over time. This includes monthly contributions, annual
								fees, and initial membership payments.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>Total revenue generated over time</FrameDescription>
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
				<ChartContainer config={chartConfig} className="h-[300px] w-full">
					{chartType === "area" ? (
						<AreaChart accessibilityLayer data={chartData}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="month"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>
							<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
							<defs>
								<linearGradient
									id="gradient-revenue"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor="var(--color-revenue)"
										stopOpacity={0.5}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-revenue)"
										stopOpacity={0.1}
									/>
								</linearGradient>
							</defs>
							<Area
								dataKey="revenue"
								type="natural"
								fill="url(#gradient-revenue)"
								fillOpacity={0.4}
								stroke="var(--color-revenue)"
								strokeWidth={2}
							/>
						</AreaChart>
					) : (
						<BarChart accessibilityLayer data={chartData}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="month"
								tickLine={false}
								tickMargin={10}
								axisLine={false}
							/>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent indicator="dashed" />}
							/>
							<Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
						</BarChart>
					)}
				</ChartContainer>
			</FramePanel>
		</Frame>
	);
}

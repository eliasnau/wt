"use client";

import {
	AreaChartIcon,
	BarChartIcon,
	InfoIcon,
} from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
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
	revenue: {
		label: "Umsatz",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

type ChartType = "area" | "bar";

export type TotalRevenueChartData = {
	month: string;
	revenue: number;
};

interface TotalRevenueChartProps {
	data: TotalRevenueChartData[];
	isPending?: boolean;
}

export function TotalRevenueChart({
	data,
	isPending = false,
}: TotalRevenueChartProps) {
	const [chartType, setChartType] = useState<ChartType>("area");
	const chartData = data;

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>Umsatz gesamt</FrameTitle>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button variant="ghost" size="sm" className="h-5 w-5 p-0" />
								}
							>
								<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								Zeigt den gesamten eingenommenen Umsatz im Zeitverlauf. Darin
								enthalten sind Mitgliedsbeitrage, Jahresbeitrage und
								Aufnahmegebuhren.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>Entwicklung des Gesamtumsatzes im Zeitverlauf</FrameDescription>
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

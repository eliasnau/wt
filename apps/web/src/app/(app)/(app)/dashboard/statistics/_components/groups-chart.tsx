"use client";

import {
	BarChartIcon,
	InfoIcon,
	LineChartIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
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

type ChartType = "line" | "bar";

type GroupsChartSeries = {
	key: string;
	label: string;
	color: string;
};

interface GroupsChartProps {
	data: Array<Record<string, string | number>>;
	series: GroupsChartSeries[];
	isPending?: boolean;
}

export function GroupsChart({
	data,
	series,
	isPending = false,
}: GroupsChartProps) {
	const [chartType, setChartType] = useState<ChartType>("line");
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
						<FrameTitle>Mitglieder pro Gruppe</FrameTitle>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button variant="ghost" size="sm" className="h-5 w-5 p-0" />
								}
							>
								<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								Zeigt die Verteilung der Mitglieder auf verschiedene Gruppen.
								So lassen sich beliebte Gruppen und Entwicklungen im Zeitverlauf
								schnell erkennen.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>
						Mitgliederanzahl in den verschiedenen Gruppen
					</FrameDescription>
				</div>
				<div className="flex gap-1 rounded-lg border p-1">
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
						dataKeys={dataKeys}
					/>
				) : (
					<BarChart data={chartData} config={chartConfig} dataKeys={dataKeys} />
				)}
			</FramePanel>
		</Frame>
	);
}

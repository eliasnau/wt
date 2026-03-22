"use client";

import {
	AreaChartIcon,
	BarChartIcon,
	InfoIcon,
} from "lucide-react";
import { useState } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
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

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>Mitglieder gesamt</FrameTitle>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button variant="ghost" size="sm" className="h-5 w-5 p-0" />
								}
							>
								<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								Zeigt die gesamte Anzahl aktiver Mitglieder im Zeitverlauf. So
								wird das langfristige Wachstum der Organisation sichtbar.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>
						Entwicklung der Gesamtzahl an Mitgliedern im Zeitverlauf
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

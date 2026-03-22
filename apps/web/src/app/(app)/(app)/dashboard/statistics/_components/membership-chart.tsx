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
	newMembers: {
		label: "Neue Mitglieder",
		color: "#16a34a",
	},
	cancellations: {
		label: "Kündigungen",
		color: "#dc2626",
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

	return (
		<Frame>
			<FrameHeader className="flex-row items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<FrameTitle>Mitgliederentwicklung</FrameTitle>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button variant="ghost" size="sm" className="h-5 w-5 p-0" />
								}
							>
								<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								Zeigt neue Anmeldungen und Kündigungen im Zeitverlauf. Die
								Prozentangabe beschreibt die Nettoveränderung im Vergleich zum
								vorherigen Zeitraum.
							</TooltipContent>
						</Tooltip>
					</div>
					<FrameDescription>
						Neue Mitglieder und Kündigungen im ausgewählten Zeitraum
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

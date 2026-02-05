"use client";

import { useMemo, useState } from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	AlertCircle,
	AreaChartIcon,
	BarChartIcon,
	ChevronDownIcon,
	InfoIcon,
} from "lucide-react";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { EnrollmentCancellationPieChart } from "../_components/enrollment-cancellation-pie";
import { GroupMixPieChart } from "../_components/group-mix-pie";
import { PricingByGroupPieChart } from "../_components/pricing-by-group-pie";
import { FeesBreakdownChart } from "../_components/fees-breakdown-chart";
import { cn } from "@/lib/utils";
import { BarChart } from "@/components/charts/bar-chart";
import type { ChartConfig } from "@/components/ui/chart";

function getMonthOptions() {
	const currentMonth = startOfMonth(new Date());
	const startMonth = subMonths(currentMonth, 11);
	const months: Date[] = [];
	let cursor = startMonth;
	while (cursor <= currentMonth) {
		months.push(cursor);
		cursor = startOfMonth(subMonths(cursor, -1));
	}
	return months;
}

export default function StatisticsOverviewPage() {
	const monthOptions = useMemo(() => getMonthOptions(), []);
	const currentMonth = startOfMonth(new Date());
	const [selectedMonth, setSelectedMonth] = useState(currentMonth);
	const [feeChartType, setFeeChartType] = useState<"pie" | "bar">("pie");
	const [flowChartType, setFlowChartType] = useState<"pie" | "bar">("pie");
	const [groupChartType, setGroupChartType] = useState<"pie" | "bar">("pie");
	const selectedMonthValue = format(selectedMonth, "yyyy-MM");

	const selectedMonthLabel = format(selectedMonth, "MMMM yyyy");
	const isCurrentMonth =
		format(selectedMonth, "yyyy-MM") === format(currentMonth, "yyyy-MM");

	const statsQueryOptions = orpc.statistics.monthlyOverview.queryOptions({
		input: { month: selectedMonthValue },
	});

	const { data, isPending, error, refetch } = useQuery({
		...statsQueryOptions,
	});

	const formatCurrency = (value: string | number | null | undefined) => {
		if (!value) return "€0.00";
		const numeric = typeof value === "number" ? value : Number(value);
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "EUR",
		}).format(Number.isFinite(numeric) ? numeric : 0);
	};

	const flowChartConfig = {
		enrollments: { label: "Enrollments", color: "var(--chart-1)" },
		cancellations: { label: "Cancellations", color: "var(--chart-2)" },
	} satisfies ChartConfig;

	const groupChartConfig = {
		value: { label: "Members", color: "var(--chart-3)" },
	} satisfies ChartConfig;


	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Monthly Overview</HeaderTitle>
					<HeaderDescription>
						A snapshot of performance for a single month. Future months are
						disabled.
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<div className="flex items-center gap-2">
						<Select
							value={format(selectedMonth, "yyyy-MM")}
							onValueChange={(value) => {
								const match = monthOptions.find(
									(month) => format(month, "yyyy-MM") === value,
								);
								if (match) {
									setSelectedMonth(match);
								}
							}}
						>
							<SelectTrigger className="w-[220px]" size="sm">
								<SelectValue placeholder="Select month" />
							</SelectTrigger>
							<SelectPopup>
								{monthOptions.map((month) => {
									const value = format(month, "yyyy-MM");
									return (
										<SelectItem key={value} value={value}>
											{format(month, "MMMM yyyy")}
										</SelectItem>
									);
								})}
							</SelectPopup>
						</Select>
						{isCurrentMonth && (
							<Badge variant="outline" className="text-xs">
								Current Month
							</Badge>
						)}
					</div>
				</HeaderActions>
			</Header>

			{error ? (
				<Frame>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>Failed to load statistics</EmptyTitle>
								<EmptyDescription>
									{error instanceof Error
										? error.message
										: "Something went wrong. Please try again."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => refetch()}>Try Again</Button>
							</EmptyContent>
						</Empty>
					</FramePanel>
				</Frame>
			) : (
				<div className="grid gap-6 lg:grid-cols-3">
					<Frame>
						<FrameHeader className="flex-row items-start justify-between">
							<div>
								<p className="text-muted-foreground text-xs uppercase">
									Active Members
								</p>
								<p className="text-2xl font-semibold">
									{isPending ? "—" : data?.kpis.activeMembers ?? 0}
								</p>
								<p className="text-muted-foreground text-xs">
									As of {selectedMonthLabel}
								</p>
							</div>
							<InfoIcon className="size-4 text-muted-foreground" />
						</FrameHeader>
					</Frame>
					<Frame>
						<FrameHeader className="flex-row items-start justify-between">
							<div>
								<p className="text-muted-foreground text-xs uppercase">
									New Enrollments
								</p>
								<p className="text-2xl font-semibold">
									{isPending ? "—" : data?.kpis.newEnrollments ?? 0}
								</p>
								<p className="text-muted-foreground text-xs">
									Total for {selectedMonthLabel}
								</p>
							</div>
							<InfoIcon className="size-4 text-muted-foreground" />
						</FrameHeader>
					</Frame>
					<Frame>
						<FrameHeader className="flex-row items-start justify-between">
							<div>
								<p className="text-muted-foreground text-xs uppercase">
									Revenue Collected
								</p>
								<p className="text-2xl font-semibold">
									{isPending
										? "—"
										: formatCurrency(data?.kpis.revenueCollected)}
								</p>
								<p className="text-muted-foreground text-xs">
									Billing period totals
								</p>
							</div>
							<InfoIcon className="size-4 text-muted-foreground" />
						</FrameHeader>
					</Frame>
					<Frame>
						<FrameHeader className="flex-row items-start justify-between">
							<div>
								<p className="text-muted-foreground text-xs uppercase">
									Cancellations
								</p>
								<p className="text-2xl font-semibold">
									{isPending ? "—" : data?.membership.cancellations ?? 0}
								</p>
								<p className="text-muted-foreground text-xs">
									Total for {selectedMonthLabel}
								</p>
							</div>
							<InfoIcon className="size-4 text-muted-foreground" />
						</FrameHeader>
					</Frame>
				</div>
			)}

			<div className="space-y-6">
				<Frame>
					<Collapsible defaultOpen>
						<FrameHeader className="flex-row items-center justify-between px-4 py-3">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg]:rotate-180"
								render={(props) => (
									<Button variant="ghost" {...props}>
										<ChevronDownIcon className="mr-2 size-4" />
										<span className="font-semibold text-sm">
											Membership Breakdown
										</span>
									</Button>
								)}
							/>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel className="grid gap-6 lg:grid-cols-2">
								<Frame>
									<FrameHeader className="flex-row items-center justify-between">
										<div>
											<p className="text-sm font-medium">
												Enrollments vs Cancellations
											</p>
											<p className="text-muted-foreground text-xs">
												{selectedMonthLabel}
											</p>
										</div>
										<div className="flex gap-1 border rounded-lg p-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setFlowChartType("pie")}
												className={cn(
													"h-7 px-2",
													flowChartType === "pie" && "bg-muted",
												)}
											>
												<AreaChartIcon className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setFlowChartType("bar")}
												className={cn(
													"h-7 px-2",
													flowChartType === "bar" && "bg-muted",
												)}
											>
												<BarChartIcon className="h-4 w-4" />
											</Button>
										</div>
									</FrameHeader>
									<FramePanel>
										{flowChartType === "pie" ? (
											<EnrollmentCancellationPieChart
												enrollments={data?.membership.newMembers ?? 0}
												cancellations={data?.membership.cancellations ?? 0}
											/>
										) : (
											<BarChart
												data={[
													{
														month: selectedMonthLabel,
														enrollments: data?.membership.newMembers ?? 0,
														cancellations: data?.membership.cancellations ?? 0,
													},
												]}
												config={flowChartConfig}
												dataKeys={["enrollments", "cancellations"]}
												xAxisKey="month"
												height="h-[240px]"
											/>
										)}
									</FramePanel>
								</Frame>
								<Frame>
									<FrameHeader className="flex-row items-center justify-between">
										<div>
											<p className="text-sm font-medium">Members per Group</p>
											<p className="text-muted-foreground text-xs">
												{selectedMonthLabel}
											</p>
										</div>
										<div className="flex gap-1 border rounded-lg p-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setGroupChartType("pie")}
												className={cn(
													"h-7 px-2",
													groupChartType === "pie" && "bg-muted",
												)}
											>
												<AreaChartIcon className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setGroupChartType("bar")}
												className={cn(
													"h-7 px-2",
													groupChartType === "bar" && "bg-muted",
												)}
											>
												<BarChartIcon className="h-4 w-4" />
											</Button>
										</div>
									</FrameHeader>
									<FramePanel>
										{groupChartType === "pie" ? (
											<GroupMixPieChart
												data={
													data?.membership.groupMix?.map((item) => ({
														name: item.name,
														value: item.count,
													})) ?? []
												}
											/>
										) : (
											<BarChart
												data={
													data?.membership.groupMix?.map((item) => ({
														month: item.name,
														value: item.count,
													})) ?? []
												}
												config={groupChartConfig}
												dataKeys={["value"]}
												xAxisKey="month"
												height="h-[240px]"
											/>
										)}
									</FramePanel>
								</Frame>
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>

				<Frame>
					<Collapsible defaultOpen>
						<FrameHeader className="flex-row items-center justify-between px-4 py-3">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg]:rotate-180"
								render={(props) => (
									<Button variant="ghost" {...props}>
										<ChevronDownIcon className="mr-2 size-4" />
										<span className="font-semibold text-sm">
											Pricing Breakdown by Group
										</span>
									</Button>
								)}
							/>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel className="grid gap-6 lg:grid-cols-2">
								<Frame>
									<FrameHeader className="flex-row items-center justify-between">
										<div>
											<p className="text-sm font-medium">Membership Revenue</p>
											<p className="text-muted-foreground text-xs">
												By group for {selectedMonthLabel}
											</p>
										</div>
									</FrameHeader>
									<FramePanel>
										<PricingByGroupPieChart
											data={
												data?.revenue.byGroup?.map((item) => ({
													name: item.name,
													value: Number(item.total ?? 0),
												})) ?? []
											}
										/>
									</FramePanel>
								</Frame>

								<Frame>
									<FrameHeader className="flex-row items-center justify-between">
										<div>
											<p className="text-sm font-medium">Fee Mix</p>
											<p className="text-muted-foreground text-xs">
												Membership vs fees
											</p>
										</div>
										<div className="flex items-center gap-2">
											<div className="flex gap-1 border rounded-lg p-1">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setFeeChartType("pie")}
													className={cn(
														"h-7 px-2",
														feeChartType === "pie" && "bg-muted",
													)}
												>
													<AreaChartIcon className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setFeeChartType("bar")}
													className={cn(
														"h-7 px-2",
														feeChartType === "bar" && "bg-muted",
													)}
												>
													<BarChartIcon className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</FrameHeader>
									<FramePanel>
										<FeesBreakdownChart
											membership={Number(data?.revenue.membershipTotal ?? 0)}
											joining={Number(data?.revenue.joiningFeeTotal ?? 0)}
											yearly={Number(data?.revenue.yearlyFeeTotal ?? 0)}
											label={selectedMonthLabel}
											chartType={feeChartType}
										/>
									</FramePanel>
								</Frame>
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>

			</div>
		</div>
	);
}

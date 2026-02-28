"use client";

import { useQuery } from "@tanstack/react-query";
import { eachMonthOfInterval, format, startOfMonth, subMonths } from "date-fns";
import { AlertCircle, ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { orpc } from "@/utils/orpc";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { GroupsChart } from "../_components/groups-chart";
import { TotalRevenueChart } from "../_components/income-chart";
import { MembershipChart } from "../_components/membership-chart";
import { RevenueChart } from "../_components/revenue-chart";
import { TotalMembersChart } from "../_components/total-members-chart";

type GroupSeries = {
	key: string;
	label: string;
	color: string;
};

type TimelineGroupBy = "month" | "quarter" | "year";

function parseMonthValue(monthValue: string) {
	const [year, month] = monthValue.split("-").map(Number);
	return new Date(year, month - 1, 1);
}

function getPeriodChartLabel(
	period: {
		key: string;
		startMonth: string;
	},
	groupBy: TimelineGroupBy,
) {
	if (groupBy === "year") {
		return period.key.slice(2);
	}

	if (groupBy === "quarter") {
		return period.key.split("-")[1] ?? period.key;
	}

	return format(parseMonthValue(period.startMonth), "MMM");
}

export default function RangeComparisonPage() {
	const currentMonth = startOfMonth(new Date());
	const monthOptions = useMemo(() => {
		const start = startOfMonth(subMonths(currentMonth, 119));
		return eachMonthOfInterval({
			start,
			end: currentMonth,
		});
	}, [currentMonth]);
	const [startMonth, setStartMonth] = useState(
		format(startOfMonth(subMonths(currentMonth, 5)), "yyyy-MM"),
	);
	const [endMonth, setEndMonth] = useState(format(currentMonth, "yyyy-MM"));
	const [groupBy, setGroupBy] = useState<TimelineGroupBy>("month");

	const hasValidRange = startMonth <= endMonth;
	const startMonthValue = startMonth;
	const endMonthValue = endMonth;

	const getRangeText = (start: string, end: string) => {
		return `${format(parseMonthValue(start), "MMM yyyy")} - ${format(parseMonthValue(end), "MMM yyyy")}`;
	};

	const timelineQueryOptions = orpc.statistics.timeline.queryOptions({
		input: {
			startMonth: startMonthValue,
			endMonth: endMonthValue,
			groupBy,
		},
	});

	const { data, isPending, error, refetch } = useQuery({
		...timelineQueryOptions,
		enabled: hasValidRange && Boolean(startMonthValue && endMonthValue),
	});

	const periods = data?.periods ?? [];
	const periodLabels = useMemo(
		() =>
			new Map(
				periods.map((period) => [
					period.key,
					getPeriodChartLabel(period, groupBy),
				]),
			),
		[groupBy, periods],
	);

	const membershipData = useMemo(
		() =>
			periods.map((period) => ({
				month: periodLabels.get(period.key) ?? period.label,
				newMembers: period.membership.newMembers,
				cancellations: period.membership.cancellations,
			})),
		[periodLabels, periods],
	);

	const totalMembersData = useMemo(
		() =>
			periods.map((period) => ({
				month: periodLabels.get(period.key) ?? period.label,
				total: period.kpis.activeMembers,
			})),
		[periodLabels, periods],
	);

	const totalRevenueData = useMemo(
		() =>
			periods.map((period) => ({
				month: periodLabels.get(period.key) ?? period.label,
				revenue: Number(period.kpis.revenueCollected ?? 0),
			})),
		[periodLabels, periods],
	);

	const groupSeries = useMemo<GroupSeries[]>(() => {
		const groups = new Map<
			string,
			{ label: string; color: string | null | undefined }
		>();

		for (const period of periods) {
			for (const group of period.membership.groupMix) {
				if (!groups.has(group.groupId)) {
					groups.set(group.groupId, {
						label: group.name,
						color: group.color,
					});
				}
			}

			for (const group of period.revenue.byGroup) {
				if (!groups.has(group.groupId)) {
					groups.set(group.groupId, {
						label: group.name,
						color: group.color,
					});
				}
			}
		}

		return Array.from(groups.entries()).map(([groupId, group], index) => ({
			key: groupId,
			label: group.label,
			color: group.color ?? `var(--chart-${(index % 5) + 1})`,
		}));
	}, [periods]);

	const groupsMemberData = useMemo(() => {
		return periods.map((period) => {
			const row: Record<string, string | number> = {
				month: periodLabels.get(period.key) ?? period.label,
			};
			const countByGroupId = new Map(
				period.membership.groupMix.map((group) => [group.groupId, group.count]),
			);

			for (const group of groupSeries) {
				row[group.key] = countByGroupId.get(group.key) ?? 0;
			}

			return row;
		});
	}, [groupSeries, periodLabels, periods]);

	const groupsRevenueData = useMemo(() => {
		return periods.map((period) => {
			const row: Record<string, string | number> = {
				month: periodLabels.get(period.key) ?? period.label,
			};
			const revenueByGroupId = new Map(
				period.revenue.byGroup.map((group) => [
					group.groupId,
					Number(group.total ?? 0),
				]),
			);

			for (const group of groupSeries) {
				row[group.key] = revenueByGroupId.get(group.key) ?? 0;
			}

			return row;
		});
	}, [groupSeries, periodLabels, periods]);

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Compare Months</HeaderTitle>
					<HeaderDescription>
						Analyze membership and revenue trends across a custom month range
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<div className="flex items-center gap-2">
						<Select
							value={startMonth}
							onValueChange={(value) => {
								if (!value) {
									return;
								}
								setStartMonth(value);
								if (value > endMonth) {
									setEndMonth(value);
								}
							}}
						>
							<SelectTrigger className="w-[150px]" size="sm">
								<SelectValue placeholder="Start month" />
							</SelectTrigger>
							<SelectPopup>
								{monthOptions.map((month) => {
									const value = format(month, "yyyy-MM");
									return (
										<SelectItem key={value} value={value}>
											{format(month, "MMM yyyy")}
										</SelectItem>
									);
								})}
							</SelectPopup>
						</Select>

						<Select
							value={endMonth}
							onValueChange={(value) => {
								if (!value) {
									return;
								}
								setEndMonth(value);
								if (value < startMonth) {
									setStartMonth(value);
								}
							}}
						>
							<SelectTrigger className="w-[150px]" size="sm">
								<SelectValue placeholder="End month" />
							</SelectTrigger>
							<SelectPopup>
								{monthOptions.map((month) => {
									const value = format(month, "yyyy-MM");
									return (
										<SelectItem key={value} value={value}>
											{format(month, "MMM yyyy")}
										</SelectItem>
									);
								})}
							</SelectPopup>
						</Select>

						<Select
							value={groupBy}
							onValueChange={(value) => {
								if (!value) {
									return;
								}
								setGroupBy(value as TimelineGroupBy);
							}}
						>
							<SelectTrigger className="w-[140px]" size="sm">
								<SelectValue placeholder="Group by" />
							</SelectTrigger>
							<SelectPopup>
								<SelectItem value="month">Monthly</SelectItem>
								<SelectItem value="quarter">Quarterly</SelectItem>
								<SelectItem value="year">Yearly</SelectItem>
							</SelectPopup>
						</Select>
						<p className="text-muted-foreground text-sm tabular-nums">
							{getRangeText(startMonth, endMonth)}
						</p>
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
								<EmptyTitle>
									Statistiken konnten nicht geladen werden
								</EmptyTitle>
								<EmptyDescription>
									{error instanceof Error
										? error.message
										: "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => refetch()}>Erneut versuchen</Button>
							</EmptyContent>
						</Empty>
					</FramePanel>
				</Frame>
			) : (
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
												Membership Analytics
											</span>
										</Button>
									)}
								/>
							</FrameHeader>
							<CollapsiblePanel>
								<FramePanel className="space-y-6">
									<MembershipChart
										data={membershipData}
										isPending={isPending}
									/>
									<div className="grid gap-6 md:grid-cols-2">
										<TotalMembersChart
											data={totalMembersData}
											isPending={isPending}
										/>
										<GroupsChart
											data={groupsMemberData}
											series={groupSeries}
											isPending={isPending}
										/>
									</div>
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
												Financial Analytics
											</span>
										</Button>
									)}
								/>
							</FrameHeader>
							<CollapsiblePanel>
								<FramePanel className="space-y-6">
									<div className="grid gap-6 md:grid-cols-2">
										<TotalRevenueChart
											data={totalRevenueData}
											isPending={isPending}
										/>
										<RevenueChart
											data={groupsRevenueData}
											series={groupSeries}
											isPending={isPending}
										/>
									</div>
								</FramePanel>
							</CollapsiblePanel>
						</Collapsible>
					</Frame>
				</div>
			)}
		</div>
	);
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { eachMonthOfInterval, format, startOfMonth, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import {
	AlertCircle,
	ArrowRightLeft,
	Banknote,
	Layers,
	type LucideIcon,
	TrendingUp,
	UserMinus,
	Users,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardFrame,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { ChartCard } from "../_components/chart-card";
import { FlowTrendChart } from "../_components/flow-trend-chart";
import { GroupTrendChart } from "../_components/group-trend-chart";
import { TrendAreaChart } from "../_components/trend-area-chart";

type TimelineGroupBy = "month" | "quarter" | "year";

type GroupSeries = {
	key: string;
	label: string;
	color: string;
};

const PERIOD_NOUN: Record<TimelineGroupBy, string> = {
	month: "Monat",
	quarter: "Quartal",
	year: "Jahr",
};

const numberFormatter = new Intl.NumberFormat("de-DE");
const currencyFormatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});
const signedPercentFormatter = new Intl.NumberFormat("de-DE", {
	style: "percent",
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
	signDisplay: "always",
});
const percentFormatter = new Intl.NumberFormat("de-DE", {
	style: "percent",
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

function toNumber(value: string | number | null | undefined) {
	const numeric = typeof value === "number" ? value : Number(value ?? 0);
	return Number.isFinite(numeric) ? numeric : 0;
}

function formatNumber(value: number) {
	return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatCurrency(value: number) {
	return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function parseMonthValue(monthValue: string) {
	const [year, month] = monthValue.split("-").map(Number);
	return new Date(year, month - 1, 1);
}

function getPeriodChartLabel(
	period: { key: string; startMonth: string },
	groupBy: TimelineGroupBy,
) {
	if (groupBy === "year") {
		return period.key.slice(2);
	}
	if (groupBy === "quarter") {
		return period.key.split("-")[1] ?? period.key;
	}
	return format(parseMonthValue(period.startMonth), "MMM", { locale: de });
}

function SectionHeading({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="space-y-1">
			<h2 className="font-heading text-lg tracking-tight">{title}</h2>
			<p className="text-muted-foreground text-sm">{description}</p>
		</div>
	);
}

function TrendKpiCard({
	icon: Icon,
	label,
	value,
	hint,
	valueClassName,
	isLoading,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	hint: ReactNode;
	valueClassName?: string;
	isLoading: boolean;
}) {
	return (
		<CardFrame>
			<CardFrameHeader className="px-4 py-2.5">
				<CardFrameTitle className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
					<Icon className="size-3.5" aria-hidden="true" />
					{label}
				</CardFrameTitle>
			</CardFrameHeader>
			<Card>
				<CardPanel className="flex flex-col gap-1 px-4 pt-2.5 pb-4">
					{isLoading ? (
						<Skeleton className="h-8 w-28 rounded-md" />
					) : (
						<span
							className={cn(
								"font-bold text-3xl tabular-nums tracking-tight",
								valueClassName,
							)}
						>
							{value}
						</span>
					)}
					{isLoading ? (
						<Skeleton className="mt-1 h-4 w-24 rounded" />
					) : (
						<p className="text-muted-foreground text-sm">{hint}</p>
					)}
				</CardPanel>
			</Card>
		</CardFrame>
	);
}

export default function StatisticsTrendsPage() {
	const currentMonth = useMemo(() => startOfMonth(new Date()), []);
	const monthOptions = useMemo(
		() =>
			eachMonthOfInterval({
				start: startOfMonth(subMonths(currentMonth, 119)),
				end: currentMonth,
			}),
		[currentMonth],
	);
	const monthSelectItems = useMemo(
		() =>
			monthOptions.map((month) => ({
				value: format(month, "yyyy-MM"),
				label: format(month, "MMM yyyy", { locale: de }),
			})),
		[monthOptions],
	);
	const groupByItems = useMemo(
		() => [
			{ value: "month", label: "Monatlich" },
			{ value: "quarter", label: "Quartalsweise" },
			{ value: "year", label: "Jährlich" },
		],
		[],
	);

	const [startMonth, setStartMonth] = useState(
		format(startOfMonth(subMonths(currentMonth, 5)), "yyyy-MM"),
	);
	const [endMonth, setEndMonth] = useState(format(currentMonth, "yyyy-MM"));
	const [groupBy, setGroupBy] = useState<TimelineGroupBy>("month");

	const hasValidRange = startMonth <= endMonth;

	const { data, error, refetch } = useQuery({
		...orpc.statistics.timeline.queryOptions({
			input: { startMonth, endMonth, groupBy },
		}),
		enabled: hasValidRange,
	});

	// Trust the data only when it matches the current range + grouping, so a
	// control change drops into a loading state instead of flashing stale data.
	const isLoading =
		!data ||
		data.range.startMonth !== startMonth ||
		data.range.endMonth !== endMonth ||
		data.groupBy !== groupBy;

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

	const membersData = useMemo(
		() =>
			periods.map((period) => ({
				label: periodLabels.get(period.key) ?? period.label,
				value: period.kpis.activeMembers,
			})),
		[periodLabels, periods],
	);

	const flowData = useMemo(
		() =>
			periods.map((period) => ({
				label: periodLabels.get(period.key) ?? period.label,
				enrollments: period.membership.newMembers,
				cancellations: period.membership.cancellations,
			})),
		[periodLabels, periods],
	);

	const revenueData = useMemo(
		() =>
			periods.map((period) => ({
				label: periodLabels.get(period.key) ?? period.label,
				value: toNumber(period.kpis.revenueCollected),
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
					groups.set(group.groupId, { label: group.name, color: group.color });
				}
			}
			for (const group of period.revenue.byGroup) {
				if (!groups.has(group.groupId)) {
					groups.set(group.groupId, { label: group.name, color: group.color });
				}
			}
		}
		return Array.from(groups.entries()).map(([groupId, group], index) => ({
			key: groupId,
			label: group.label,
			color: group.color ?? `var(--chart-${(index % 5) + 1})`,
		}));
	}, [periods]);

	const groupMembersData = useMemo(
		() =>
			periods.map((period) => {
				const row: Record<string, string | number> = {
					label: periodLabels.get(period.key) ?? period.label,
				};
				const countByGroupId = new Map(
					period.membership.groupMix.map((group) => [
						group.groupId,
						group.count,
					]),
				);
				for (const group of groupSeries) {
					row[group.key] = countByGroupId.get(group.key) ?? 0;
				}
				return row;
			}),
		[groupSeries, periodLabels, periods],
	);

	const groupRevenueData = useMemo(
		() =>
			periods.map((period) => {
				const row: Record<string, string | number> = {
					label: periodLabels.get(period.key) ?? period.label,
				};
				const revenueByGroupId = new Map(
					period.revenue.byGroup.map((group) => [
						group.groupId,
						toNumber(group.total),
					]),
				);
				for (const group of groupSeries) {
					row[group.key] = revenueByGroupId.get(group.key) ?? 0;
				}
				return row;
			}),
		[groupSeries, periodLabels, periods],
	);

	const activeStart = periods[0]?.kpis.activeMembers ?? 0;
	const activeEnd = periods[periods.length - 1]?.kpis.activeMembers ?? 0;
	const netGrowth = activeEnd - activeStart;
	const netGrowthPct = activeStart > 0 ? netGrowth / activeStart : null;
	const totalCancellations = periods.reduce(
		(sum, period) => sum + period.membership.cancellations,
		0,
	);
	const totalRevenue = periods.reduce(
		(sum, period) => sum + toNumber(period.kpis.revenueCollected),
		0,
	);
	const churnRate = activeStart > 0 ? totalCancellations / activeStart : null;
	const avgRevenue = periods.length > 0 ? totalRevenue / periods.length : 0;

	const netGrowthValue = `${netGrowth > 0 ? "+" : ""}${formatNumber(netGrowth)}`;
	const netGrowthTone =
		netGrowth > 0
			? "text-emerald-600 dark:text-emerald-400"
			: netGrowth < 0
				? "text-red-600 dark:text-red-400"
				: undefined;

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Trends</HeaderTitle>
					<HeaderDescription>
						Wie sich Mitglieder und Umsatz über einen frei wählbaren Zeitraum
						entwickeln.
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<div className="flex flex-wrap items-center gap-2">
						<Select
							items={monthSelectItems}
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
								<SelectValue placeholder="Startmonat" />
							</SelectTrigger>
							<SelectPopup>
								{monthOptions.map((month) => {
									const value = format(month, "yyyy-MM");
									return (
										<SelectItem key={value} value={value}>
											{format(month, "MMM yyyy", { locale: de })}
										</SelectItem>
									);
								})}
							</SelectPopup>
						</Select>

						<Select
							items={monthSelectItems}
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
								<SelectValue placeholder="Endmonat" />
							</SelectTrigger>
							<SelectPopup>
								{monthOptions.map((month) => {
									const value = format(month, "yyyy-MM");
									return (
										<SelectItem key={value} value={value}>
											{format(month, "MMM yyyy", { locale: de })}
										</SelectItem>
									);
								})}
							</SelectPopup>
						</Select>

						<Select
							items={groupByItems}
							value={groupBy}
							onValueChange={(value) => {
								if (!value) {
									return;
								}
								setGroupBy(value as TimelineGroupBy);
							}}
						>
							<SelectTrigger className="w-[150px]" size="sm">
								<SelectValue placeholder="Gruppieren nach" />
							</SelectTrigger>
							<SelectPopup>
								<SelectItem value="month">Monatlich</SelectItem>
								<SelectItem value="quarter">Quartalsweise</SelectItem>
								<SelectItem value="year">Jährlich</SelectItem>
							</SelectPopup>
						</Select>
					</div>
				</HeaderActions>
			</Header>

			{error ? (
				<CardFrame>
					<Card>
						<CardPanel className="py-4">
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<AlertCircle />
									</EmptyMedia>
									<EmptyTitle>Trends konnten nicht geladen werden</EmptyTitle>
									<EmptyDescription>
										Etwas ist schiefgelaufen. Bitte versuche es erneut.
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button onClick={() => refetch()}>Erneut versuchen</Button>
								</EmptyContent>
							</Empty>
						</CardPanel>
					</Card>
				</CardFrame>
			) : (
				<>
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						<TrendKpiCard
							icon={Users}
							label="Aktive Mitglieder"
							value={formatNumber(activeEnd)}
							hint={`Start: ${formatNumber(activeStart)}`}
							isLoading={isLoading}
						/>
						<TrendKpiCard
							icon={TrendingUp}
							label="Netto-Wachstum"
							value={netGrowthValue}
							valueClassName={netGrowthTone}
							hint={
								netGrowthPct !== null
									? `${signedPercentFormatter.format(netGrowthPct)} ggü. Start`
									: "im Zeitraum"
							}
							isLoading={isLoading}
						/>
						<TrendKpiCard
							icon={UserMinus}
							label="Churn-Rate"
							value={
								churnRate !== null ? percentFormatter.format(churnRate) : "—"
							}
							hint={`${formatNumber(totalCancellations)} Kündigungen`}
							isLoading={isLoading}
						/>
						<TrendKpiCard
							icon={Banknote}
							label="Umsatz"
							value={formatCurrency(totalRevenue)}
							hint={`Ø ${formatCurrency(avgRevenue)} / ${PERIOD_NOUN[groupBy]}`}
							isLoading={isLoading}
						/>
					</div>

					<section className="flex flex-col gap-4">
						<SectionHeading
							title="Mitglieder"
							description="Wie sich Mitgliederzahl und Zusammensetzung im Zeitraum entwickeln."
						/>
						<ChartCard title="Mitglieder gesamt" icon={Users}>
							<TrendAreaChart
								data={membersData}
								seriesLabel="Mitglieder gesamt"
								color={{ light: "#4f46e5", dark: "#818cf8" }}
								isLoading={isLoading}
								emptyMessage="Keine Mitgliederdaten im Zeitraum."
							/>
						</ChartCard>
						<div className="grid gap-4 md:grid-cols-2 lg:gap-5">
							<ChartCard title="Zu- & Abgänge" icon={ArrowRightLeft}>
								<FlowTrendChart data={flowData} isLoading={isLoading} />
							</ChartCard>
							<ChartCard title="Mitglieder nach Gruppe" icon={Layers}>
								<GroupTrendChart
									data={groupMembersData}
									series={groupSeries}
									isLoading={isLoading}
									emptyMessage="Keine Gruppendaten im Zeitraum."
								/>
							</ChartCard>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<SectionHeading
							title="Finanzen"
							description="Umsatzentwicklung und Verteilung des Beitragsumsatzes nach Gruppe."
						/>
						<div className="grid gap-4 md:grid-cols-2 lg:gap-5">
							<ChartCard title="Umsatzentwicklung" icon={Banknote}>
								<TrendAreaChart
									data={revenueData}
									seriesLabel="Umsatz"
									color={{ light: "#d97706", dark: "#fbbf24" }}
									valueFormat="currency"
									isLoading={isLoading}
									emptyMessage="Kein Umsatz im Zeitraum."
								/>
							</ChartCard>
							<ChartCard title="Umsatz nach Gruppe" icon={Layers}>
								<GroupTrendChart
									data={groupRevenueData}
									series={groupSeries}
									valueFormat="currency"
									isLoading={isLoading}
									emptyMessage="Kein Beitragsumsatz im Zeitraum."
								/>
							</ChartCard>
						</div>
					</section>
				</>
			)}
		</div>
	);
}

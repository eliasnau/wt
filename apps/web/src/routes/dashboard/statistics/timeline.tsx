import { Button } from "@matdesk/ui/components/button";
import {
	Card,
	CardFrame,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@matdesk/ui/components/card";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@matdesk/ui/components/select";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { cn } from "@matdesk/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { eachMonthOfInterval, format, startOfMonth, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { parseError } from "evlog";
import {
	ArrowRightLeftIcon,
	BanknoteIcon,
	LayersIcon,
	type LucideIcon,
	TrendingUpIcon,
	UserMinusIcon,
	UsersIcon,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { ChartCard } from "@/components/dashboard/statistics/charts/chart-card";
import { FlowTrendChart } from "@/components/dashboard/statistics/charts/flow-trend-chart";
import { GroupTrendChart } from "@/components/dashboard/statistics/charts/group-trend-chart";
import { TrendAreaChart } from "@/components/dashboard/statistics/charts/trend-area-chart";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/statistics/timeline")({
	component: RouteComponent,
});

type TimelineGroupBy = "month" | "quarter" | "year";

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
const signedPercent = new Intl.NumberFormat("de-DE", {
	style: "percent",
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
	signDisplay: "always",
});
const percent = new Intl.NumberFormat("de-DE", {
	style: "percent",
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

function formatNumber(value: number) {
	return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatCurrency(value: number) {
	return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function monthShort(startMonth: string) {
	const year = Number(startMonth.slice(0, 4));
	const month = Number(startMonth.slice(5, 7));
	return format(new Date(year, month - 1, 1), "MMM", { locale: de });
}

function SectionHeading({ title, description }: { title: string; description: string }) {
	return (
		<div className="space-y-1">
			<h2 className="font-semibold text-lg tracking-tight">{title}</h2>
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
							className={cn("font-bold text-3xl tabular-nums tracking-tight", valueClassName)}
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

function RouteComponent() {
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

	const [startMonth, setStartMonth] = useState(
		format(startOfMonth(subMonths(currentMonth, 5)), "yyyy-MM"),
	);
	const [endMonth, setEndMonth] = useState(format(currentMonth, "yyyy-MM"));
	const [groupBy, setGroupBy] = useState<TimelineGroupBy>("month");

	const hasValidRange = startMonth <= endMonth;

	const { data, isError, error, refetch } = useQuery({
		...orpc.statistics.timeline.queryOptions({ input: { startMonth, endMonth, groupBy } }),
		enabled: hasValidRange,
	});

	// Only trust data that matches the current controls, so a control change
	// drops to a loading state instead of flashing stale data.
	const isLoading =
		!data ||
		data.range.startMonth !== startMonth ||
		data.range.endMonth !== endMonth ||
		data.range.groupBy !== groupBy;

	const periods = data?.periods ?? [];

	const membersData = useMemo(
		() => periods.map((p) => ({ label: monthShort(p.startMonth), value: p.activeMembersEnd })),
		[periods],
	);
	const flowData = useMemo(
		() =>
			periods.map((p) => ({
				label: monthShort(p.startMonth),
				enrollments: p.newEnrollments,
				cancellations: p.cancellations,
			})),
		[periods],
	);
	const revenueData = useMemo(
		() =>
			periods.map((p) => ({
				label: monthShort(p.startMonth),
				value: (p.revenue.membershipCents + p.revenue.feesCents) / 100,
			})),
		[periods],
	);

	const groupSeries = useMemo(() => {
		const groups = new Map<string, { label: string; color: string }>();
		for (const p of periods) {
			for (const g of p.revenue.byGroup) {
				if (!groups.has(g.groupId)) groups.set(g.groupId, { label: g.name, color: g.color });
			}
		}
		return Array.from(groups.entries()).map(([key, g], i) => ({
			key,
			label: g.label,
			color: g.color ?? `var(--chart-${(i % 5) + 1})`,
		}));
	}, [periods]);

	const groupRevenueData = useMemo(
		() =>
			periods.map((p) => {
				const row: Record<string, string | number> = { label: monthShort(p.startMonth) };
				const byGroup = new Map(p.revenue.byGroup.map((g) => [g.groupId, g.totalCents / 100]));
				for (const series of groupSeries) row[series.key] = byGroup.get(series.key) ?? 0;
				return row;
			}),
		[groupSeries, periods],
	);

	const totals = data?.totals;
	const activeStart = totals?.activeMembersStart ?? 0;
	const activeEnd = totals?.activeMembersEnd ?? 0;
	const netGrowth = activeEnd - activeStart;
	const netGrowthPct = activeStart > 0 ? netGrowth / activeStart : null;
	const totalCancellations = totals?.cancellations ?? 0;
	const totalRevenue = totals
		? (totals.revenue.membershipCents + totals.revenue.feesCents) / 100
		: 0;
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
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Zeitverlauf</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Wie sich Mitglieder und Umsatz über einen frei wählbaren Zeitraum entwickeln.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						items={monthSelectItems}
						onValueChange={(value) => {
							if (!value) return;
							setStartMonth(value as string);
							if (value > endMonth) setEndMonth(value as string);
						}}
						value={startMonth}
					>
						<SelectTrigger className="w-[150px]" size="sm">
							<SelectValue placeholder="Startmonat" />
						</SelectTrigger>
						<SelectPopup>
							{monthSelectItems.map((m) => (
								<SelectItem key={m.value} value={m.value}>
									{m.label}
								</SelectItem>
							))}
						</SelectPopup>
					</Select>
					<Select
						items={monthSelectItems}
						onValueChange={(value) => {
							if (!value) return;
							setEndMonth(value as string);
							if (value < startMonth) setStartMonth(value as string);
						}}
						value={endMonth}
					>
						<SelectTrigger className="w-[150px]" size="sm">
							<SelectValue placeholder="Endmonat" />
						</SelectTrigger>
						<SelectPopup>
							{monthSelectItems.map((m) => (
								<SelectItem key={m.value} value={m.value}>
									{m.label}
								</SelectItem>
							))}
						</SelectPopup>
					</Select>
					<Select
						items={[
							{ value: "month", label: "Monatlich" },
							{ value: "quarter", label: "Quartalsweise" },
							{ value: "year", label: "Jährlich" },
						]}
						onValueChange={(value) => {
							if (value) setGroupBy(value as TimelineGroupBy);
						}}
						value={groupBy}
					>
						<SelectTrigger className="w-[150px]" size="sm">
							<SelectValue placeholder="Gruppieren" />
						</SelectTrigger>
						<SelectPopup>
							<SelectItem value="month">Monatlich</SelectItem>
							<SelectItem value="quarter">Quartalsweise</SelectItem>
							<SelectItem value="year">Jährlich</SelectItem>
						</SelectPopup>
					</Select>
				</div>
			</div>

			{isError ? (
				<CardFrame className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
					<p className="text-muted-foreground text-sm">{parseError(error).message}</p>
					<Button onClick={() => refetch()} size="sm" variant="outline">
						Erneut versuchen
					</Button>
				</CardFrame>
			) : (
				<>
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						<TrendKpiCard
							hint={`Start: ${formatNumber(activeStart)}`}
							icon={UsersIcon}
							isLoading={isLoading}
							label="Aktive Mitglieder"
							value={formatNumber(activeEnd)}
						/>
						<TrendKpiCard
							hint={
								netGrowthPct !== null ? `${signedPercent.format(netGrowthPct)} ggü. Start` : "im Zeitraum"
							}
							icon={TrendingUpIcon}
							isLoading={isLoading}
							label="Netto-Wachstum"
							value={netGrowthValue}
							valueClassName={netGrowthTone}
						/>
						<TrendKpiCard
							hint={`${formatNumber(totalCancellations)} Kündigungen`}
							icon={UserMinusIcon}
							isLoading={isLoading}
							label="Churn-Rate"
							value={churnRate !== null ? percent.format(churnRate) : "—"}
						/>
						<TrendKpiCard
							hint={`Ø ${formatCurrency(avgRevenue)} / ${PERIOD_NOUN[groupBy]}`}
							icon={BanknoteIcon}
							isLoading={isLoading}
							label="Umsatz"
							value={formatCurrency(totalRevenue)}
						/>
					</div>

					<section className="flex flex-col gap-4">
						<SectionHeading
							description="Wie sich die Mitgliederzahl im Zeitraum entwickelt."
							title="Mitglieder"
						/>
						<ChartCard icon={UsersIcon} title="Mitglieder gesamt">
							<TrendAreaChart
								color={{ light: "#4f46e5", dark: "#818cf8" }}
								data={membersData}
								emptyMessage="Keine Mitgliederdaten im Zeitraum."
								isLoading={isLoading}
								seriesLabel="Mitglieder gesamt"
							/>
						</ChartCard>
						<ChartCard icon={ArrowRightLeftIcon} title="Zu- & Abgänge">
							<FlowTrendChart data={flowData} isLoading={isLoading} />
						</ChartCard>
					</section>

					<section className="flex flex-col gap-4">
						<SectionHeading
							description="Umsatzentwicklung und Verteilung des Beitragsumsatzes nach Gruppe."
							title="Finanzen"
						/>
						<div className="grid gap-4 md:grid-cols-2 lg:gap-5">
							<ChartCard icon={BanknoteIcon} title="Umsatzentwicklung">
								<TrendAreaChart
									color={{ light: "#d97706", dark: "#fbbf24" }}
									data={revenueData}
									emptyMessage="Kein Umsatz im Zeitraum."
									isLoading={isLoading}
									seriesLabel="Umsatz"
									valueFormat="currency"
								/>
							</ChartCard>
							<ChartCard icon={LayersIcon} title="Umsatz nach Gruppe">
								<GroupTrendChart
									data={groupRevenueData}
									emptyMessage="Kein Beitragsumsatz im Zeitraum."
									isLoading={isLoading}
									series={groupSeries}
									valueFormat="currency"
								/>
							</ChartCard>
						</div>
					</section>
				</>
			)}
		</div>
	);
}

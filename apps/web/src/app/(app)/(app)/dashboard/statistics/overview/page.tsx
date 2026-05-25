"use client";

import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import {
	AlertCircle,
	ArrowDown,
	ArrowRightLeft,
	ArrowUp,
	Banknote,
	type LucideIcon,
	Minus,
	PieChart,
	UserMinus,
	UserPlus,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { EnrollmentCancellationChart } from "../_components/enrollment-cancellation-chart";
import { FeeMixChart } from "../_components/fee-mix-chart";
import { MembersByGroupChart } from "../_components/members-by-group-chart";
import { RevenueByGroupChart } from "../_components/revenue-by-group-chart";

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

const numberFormatter = new Intl.NumberFormat("de-DE");
const currencyFormatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
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

function formatNumber(value: string | number | null | undefined) {
	return numberFormatter.format(toNumber(value));
}

function formatCurrency(value: string | number | null | undefined) {
	return currencyFormatter.format(toNumber(value));
}

function getDeltaPct(current: number, previous: number) {
	if (previous === 0) {
		return null;
	}
	return ((current - previous) / Math.abs(previous)) * 100;
}

type Metric = {
	label: string;
	icon: LucideIcon;
	display: string;
	current: number;
	previous: number | undefined;
	/** Whether an increase is the good direction (members up = good, churn up = bad). */
	goodWhenUp: boolean;
};

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

function MetricDelta({
	current,
	previous,
	goodWhenUp,
	isLoading,
}: {
	current: number;
	previous: number | undefined;
	goodWhenUp: boolean;
	isLoading: boolean;
}) {
	if (isLoading) {
		return <Skeleton className="h-4 w-28 rounded" />;
	}

	const pct = previous === undefined ? null : getDeltaPct(current, previous);

	if (pct === null) {
		return (
			<span className="text-muted-foreground text-xs">Kein Vergleichswert</span>
		);
	}

	const isUp = pct > 0.05;
	const isDown = pct < -0.05;
	const tone =
		!isUp && !isDown ? "neutral" : isUp === goodWhenUp ? "good" : "bad";
	const Arrow = isUp ? ArrowUp : isDown ? ArrowDown : Minus;

	return (
		<div className="flex items-center gap-1.5 text-sm">
			<span
				className={cn(
					"inline-flex items-center gap-0.5 font-medium tabular-nums",
					tone === "good" && "text-emerald-600 dark:text-emerald-400",
					tone === "bad" && "text-red-600 dark:text-red-400",
					tone === "neutral" && "text-muted-foreground",
				)}
			>
				<Arrow className="size-3.5" aria-hidden="true" />
				{percentFormatter.format(Math.abs(pct) / 100)}
			</span>
			<span className="text-muted-foreground">zum Vormonat</span>
		</div>
	);
}

function KpiCard({
	metric,
	isLoading,
	isDeltaLoading,
}: {
	metric: Metric;
	isLoading: boolean;
	isDeltaLoading: boolean;
}) {
	const { icon: Icon, label, display } = metric;

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
						<span className="font-bold text-3xl tabular-nums tracking-tight">
							{display}
						</span>
					)}
					<MetricDelta
						current={metric.current}
						previous={metric.previous}
						goodWhenUp={metric.goodWhenUp}
						isLoading={isLoading || isDeltaLoading}
					/>
				</CardPanel>
			</Card>
		</CardFrame>
	);
}

export default function StatisticsOverviewPage() {
	const monthOptions = useMemo(() => getMonthOptions(), []);
	const monthSelectItems = useMemo(
		() =>
			monthOptions.map((month) => ({
				value: format(month, "yyyy-MM"),
				label: format(month, "MMMM yyyy", { locale: de }),
			})),
		[monthOptions],
	);
	const currentMonth = startOfMonth(new Date());
	const [selectedMonth, setSelectedMonth] = useState(currentMonth);
	const selectedMonthValue = format(selectedMonth, "yyyy-MM");
	const selectedMonthLabel = format(selectedMonth, "MMMM yyyy", { locale: de });
	const previousMonthValue = format(subMonths(selectedMonth, 1), "yyyy-MM");

	const { data, error, refetch } = useQuery(
		orpc.statistics.monthlyOverview.queryOptions({
			input: { month: selectedMonthValue },
		}),
	);
	const previousData = useQuery(
		orpc.statistics.monthlyOverview.queryOptions({
			input: { month: previousMonthValue },
		}),
	).data;

	// Trust the loaded data only when it is for the selected month. On a month
	// switch the held data is still the previous selection's, so this keeps the
	// page in its loading state instead of flashing stale numbers.
	const isLoading = data?.month !== selectedMonthValue;
	const isDeltaReady = previousData?.month === previousMonthValue;

	const metrics: Metric[] = [
		{
			label: "Aktive Mitglieder",
			icon: Users,
			display: formatNumber(data?.kpis.activeMembers),
			current: toNumber(data?.kpis.activeMembers),
			previous: isDeltaReady
				? toNumber(previousData.kpis.activeMembers)
				: undefined,
			goodWhenUp: true,
		},
		{
			label: "Neue Anmeldungen",
			icon: UserPlus,
			display: formatNumber(data?.kpis.newEnrollments),
			current: toNumber(data?.kpis.newEnrollments),
			previous: isDeltaReady
				? toNumber(previousData.kpis.newEnrollments)
				: undefined,
			goodWhenUp: true,
		},
		{
			label: "Umsatz",
			icon: Banknote,
			display: formatCurrency(data?.kpis.revenueCollected),
			current: toNumber(data?.kpis.revenueCollected),
			previous: isDeltaReady
				? toNumber(previousData.kpis.revenueCollected)
				: undefined,
			goodWhenUp: true,
		},
		{
			label: "Kündigungen",
			icon: UserMinus,
			display: formatNumber(data?.membership.cancellations),
			current: toNumber(data?.membership.cancellations),
			previous: isDeltaReady
				? toNumber(previousData.membership.cancellations)
				: undefined,
			goodWhenUp: false,
		},
	];

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Monatliche Übersicht</HeaderTitle>
					<HeaderDescription>
						So entwickeln sich Mitglieder und Beiträge im gewählten Monat.
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Select
						value={selectedMonthValue}
						items={monthSelectItems}
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
							<SelectValue placeholder="Monat auswählen" />
						</SelectTrigger>
						<SelectPopup>
							{monthOptions.map((month) => {
								const value = format(month, "yyyy-MM");
								return (
									<SelectItem key={value} value={value}>
										{format(month, "MMMM yyyy", { locale: de })}
									</SelectItem>
								);
							})}
						</SelectPopup>
					</Select>
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
									<EmptyTitle>
										Statistiken konnten nicht geladen werden
									</EmptyTitle>
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
						{metrics.map((metric) => (
							<KpiCard
								key={metric.label}
								metric={metric}
								isLoading={isLoading}
								isDeltaLoading={isLoading || !isDeltaReady}
							/>
						))}
					</div>

					<section className="flex flex-col gap-4">
						<SectionHeading
							title="Mitglieder"
							description="Zu- und Abgänge sowie die Verteilung deiner Mitglieder."
						/>
						<div className="grid gap-4 md:grid-cols-2 lg:gap-5">
							<ChartCard
								title="Anmeldungen & Kündigungen"
								icon={ArrowRightLeft}
							>
								<EnrollmentCancellationChart
									period={selectedMonthLabel}
									enrollments={data?.membership.newMembers ?? 0}
									cancellations={data?.membership.cancellations ?? 0}
									isLoading={isLoading}
								/>
							</ChartCard>
							<ChartCard title="Mitglieder nach Gruppe" icon={Users}>
								<MembersByGroupChart
									data={data?.membership.groupMix}
									isLoading={isLoading}
								/>
							</ChartCard>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<SectionHeading
							title="Beiträge & Umsatz"
							description="Woraus sich der Beitragsumsatz dieses Monats zusammensetzt."
						/>
						<div className="grid gap-4 md:grid-cols-2 lg:gap-5">
							<ChartCard title="Beiträge nach Gruppe" icon={Banknote}>
								<RevenueByGroupChart
									data={data?.revenue.byGroup}
									isLoading={isLoading}
								/>
							</ChartCard>
							<ChartCard title="Beitragsmix" icon={PieChart}>
								<FeeMixChart data={data?.revenue} isLoading={isLoading} />
							</ChartCard>
						</div>
					</section>
				</>
			)}
		</div>
	);
}

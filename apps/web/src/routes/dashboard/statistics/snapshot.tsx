import { Button } from "@matdesk/ui/components/button";
import {
	Card,
	CardFrame,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@matdesk/ui/components/card";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
	BanknoteIcon,
	type LucideIcon,
	LayersIcon,
	ReceiptTextIcon,
	UsersIcon,
	WalletCardsIcon,
} from "lucide-react";

import { ChartCard } from "@/components/dashboard/statistics/charts/chart-card";
import { MembersByGroupChart } from "@/components/dashboard/statistics/charts/members-by-group-chart";
import { statisticsSnapshotQueryOptions } from "@/queries/statistics";

export const Route = createFileRoute("/dashboard/statistics/snapshot")({
	loader: ({ context }) => {
		void context.queryClient.prefetchQuery(statisticsSnapshotQueryOptions());
	},
	pendingComponent: () => <Skeleton className="h-80 rounded-2xl" />,
	component: RouteComponent,
});

const numberFormatter = new Intl.NumberFormat("de-DE");
const currencyFormatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

function KpiCard({
	icon: Icon,
	label,
	value,
	hint,
	isLoading,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	hint: string;
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
						<span className="font-bold text-3xl tabular-nums tracking-tight">{value}</span>
					)}
					<p className="text-muted-foreground text-sm">{hint}</p>
				</CardPanel>
			</Card>
		</CardFrame>
	);
}

function RouteComponent() {
	const { data, isPending, isError, error, refetch } = useQuery(
		statisticsSnapshotQueryOptions(),
	);

	const activeMembers = data?.members.active ?? 0;
	const activeValueCents = data?.revenue.activeMembershipValueCents ?? 0;
	const outstandingCents = data?.revenue.outstandingCents ?? 0;
	const draftCents = data?.revenue.draftCents ?? 0;

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Momentaufnahme</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Aktueller Stand von Mitgliedern und offenen Beträgen.
				</p>
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
						<KpiCard
							hint="Mit laufendem Vertrag"
							icon={UsersIcon}
							isLoading={isPending}
							label="Aktive Mitglieder"
							value={numberFormatter.format(activeMembers)}
						/>
						<KpiCard
							hint="Monatlicher Beitragswert"
							icon={BanknoteIcon}
							isLoading={isPending}
							label="Aktiver Mitgliedswert"
							value={currencyFormatter.format(activeValueCents / 100)}
						/>
						<KpiCard
							hint="Noch nicht eingezogen"
							icon={WalletCardsIcon}
							isLoading={isPending}
							label="Offener Betrag"
							value={currencyFormatter.format(outstandingCents / 100)}
						/>
						<KpiCard
							hint="Noch nicht finalisiert"
							icon={ReceiptTextIcon}
							isLoading={isPending}
							label="Entwürfe"
							value={currencyFormatter.format(draftCents / 100)}
						/>
					</div>

					<ChartCard icon={LayersIcon} title="Mitglieder nach Gruppe">
						<MembersByGroupChart data={data?.members.byGroup} isLoading={isPending} />
					</ChartCard>
				</>
			)}
		</div>
	);
}

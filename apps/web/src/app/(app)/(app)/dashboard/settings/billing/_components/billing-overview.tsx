"use client";

import { useCustomer } from "@repo/autumn/react";
import { CalendarClock, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/ui/frame";
import {
	Progress,
	ProgressIndicator,
	ProgressTrack,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const FEATURE_META = [
	{
		id: "users",
		label: "Benutzer",
	},
	{
		id: "members",
		label: "Mitglieder",
	},
	{
		id: "ai_messages",
		label: "KI-Nachrichten",
	},
] as const;

const PLAN_META = {
	free: {
		label: "Kostenlos",
		variant: "secondary" as const,
	},
	basic: {
		label: "Basic",
		variant: "info" as const,
	},
	pro: {
		label: "Pro",
		variant: "success" as const,
	},
	enterprise: {
		label: "Enterprise",
		variant: "warning" as const,
	},
} as const;

type UsageFeature = {
	id: (typeof FEATURE_META)[number]["id"];
	label: string;
	used: number;
	included: number | undefined;
	remaining: number | undefined;
};

type CustomerSubscription = NonNullable<
	Awaited<ReturnType<typeof useCustomer>>["data"]
>["subscriptions"][number];

type CustomerBalance = NonNullable<
	Awaited<ReturnType<typeof useCustomer>>["data"]
>["balances"][string];

function formatDate(value: number | null) {
	if (!value) return null;

	return new Date(value).toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function formatNumber(value: number | undefined) {
	return typeof value === "number" ? value.toLocaleString("de-DE") : "0";
}

function getIncludedUsage(balance: CustomerBalance) {
	if (typeof balance.granted === "number") {
		return balance.granted;
	}

	if (typeof balance.remaining === "number") {
		return (balance.usage ?? 0) + balance.remaining;
	}

	return undefined;
}

export function BillingOverview() {
	const { data: customer, isLoading } = useCustomer();

	if (isLoading && !customer) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!customer) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>Noch keine Abrechnungsdaten</EmptyTitle>
					<EmptyDescription>
						Autumn hat fuer diese Organisation noch keine
						Abrechnungsinformationen geliefert.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const activeProducts =
		customer.subscriptions?.filter(
			(subscription) =>
				subscription.status === "active" &&
				subscription.planId !== "ai_credits" &&
				subscription.planId !== "ai-credits",
		) ?? [];
	const usageFeatures: UsageFeature[] = FEATURE_META.flatMap((meta) => {
		const balance = customer.balances?.[meta.id];
		if (!balance) {
			return [];
		}

		const used = balance.usage ?? 0;
		const included = getIncludedUsage(balance);
		const remaining =
			typeof balance.remaining === "number"
				? Math.max(balance.remaining, 0)
				: typeof included === "number"
					? Math.max(included - used, 0)
					: undefined;

		return [
			{
				...meta,
				used,
				included,
				remaining,
			},
		];
	});

	return (
		<div className="space-y-6">
			<Frame className="w-full">
				<FramePanel>
					<FrameHeader className="px-0 pt-0">
						<FrameTitle>Aktiver Tarif</FrameTitle>
						<FrameDescription>
							Dein aktueller Plan und die laufende Abrechnungsperiode.
						</FrameDescription>
					</FrameHeader>

					{activeProducts.length > 0 ? (
						<div className="grid gap-3">
							{activeProducts.map((product: CustomerSubscription) => {
								const meta =
									PLAN_META[product.planId as keyof typeof PLAN_META];
								const renewsAt = formatDate(product.currentPeriodEnd);
								const trialEndsAt = formatDate(product.trialEndsAt);

								return (
									<div
										key={`${product.id}-${product.status}`}
										className="rounded-xl border bg-muted/40 p-4"
									>
										<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<Badge
														variant={meta?.variant ?? "outline"}
														size="sm"
													>
														<Sparkles className="size-3" />
														{meta?.label || product.plan?.name || product.planId}
													</Badge>
													<Badge variant="outline" size="sm">
														{product.status === "active" ? "Aktiv" : product.status}
													</Badge>
												</div>
												<p className="font-medium text-base">
													{product.plan?.name || meta?.label || product.planId}
												</p>
												<p className="text-muted-foreground text-sm">
													{product.quantity > 1
														? `${product.quantity} Einheiten aktiv`
														: "1 Einheit aktiv"}
												</p>
											</div>

											<div className="flex items-start gap-2 rounded-lg bg-background px-3 py-2 text-sm">
												<CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
												<div className="space-y-1">
													{trialEndsAt ? (
														<p className="font-medium">Test endet am {trialEndsAt}</p>
													) : renewsAt ? (
														<p className="font-medium">
															Nächste Verlängerung am {renewsAt}
														</p>
													) : (
														<p className="font-medium">Plan ist aktuell aktiv</p>
													)}
													{product.pastDue && (
														<p className="text-destructive text-xs">
															Zahlung ist überfällig
														</p>
													)}
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">
							Noch kein aktiver Tarif hinterlegt.
						</p>
					)}
				</FramePanel>
			</Frame>

			<Frame className="w-full" stackedPanels>
				<FrameHeader>
					<FrameTitle>Nutzung</FrameTitle>
				</FrameHeader>

				{usageFeatures.length > 0 ? (
					usageFeatures.map((feature) => (
						<FramePanel key={feature.id} className="gap-4">
							<div className="flex items-start justify-between gap-4">
								<h3 className="font-medium text-sm">{feature.label}</h3>
								<div className="text-right">
									<p className="font-medium text-sm tabular-nums">
										{formatNumber(feature.used)}
										{typeof feature.included === "number"
											? ` / ${formatNumber(feature.included)}`
											: ""}
									</p>
									{typeof feature.remaining === "number" && (
										<p className="text-muted-foreground text-xs tabular-nums">
											{formatNumber(feature.remaining)} frei
										</p>
									)}
								</div>
							</div>

							{typeof feature.included === "number" && feature.included > 0 && (
								<>
									<Separator />
									<Progress max={feature.included} value={feature.used}>
										<ProgressTrack>
											<ProgressIndicator />
										</ProgressTrack>
									</Progress>
								</>
							)}
						</FramePanel>
					))
				) : (
					<FramePanel>
						<p className="text-muted-foreground text-sm">
							Fuer diese Organisation sind noch keine Nutzungsdaten verfuegbar.
						</p>
					</FramePanel>
				)}
			</Frame>
		</div>
	);
}

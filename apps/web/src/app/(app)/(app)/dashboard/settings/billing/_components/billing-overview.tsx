"use client";

import { useCustomer } from "@repo/autumn/react";
import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Frame,
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

function formatNumber(value: number | undefined) {
	return typeof value === "number" ? value.toLocaleString("de-DE") : "0";
}

function getIncludedUsage(feature: {
	included_usage?: number;
	balance?: number | null;
	usage?: number;
}) {
	if (typeof feature.included_usage === "number") {
		return feature.included_usage;
	}

	if (typeof feature.balance === "number") {
		return (feature.usage ?? 0) + feature.balance;
	}

	return undefined;
}

export function BillingOverview() {
	const { customer, refetch, isLoading } = useCustomer();

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
		customer.products?.filter(
			(product) =>
				product.status === "active" &&
				product.id !== "ai_credits" &&
				product.id !== "ai-credits",
		) ?? [];
	const usageFeatures: UsageFeature[] = FEATURE_META.flatMap((meta) => {
		const feature = customer.features?.[meta.id];
		if (!feature) {
			return [];
		}

		const used = feature.usage ?? 0;
		const included = getIncludedUsage(feature);
		const remaining =
			typeof feature.balance === "number"
				? Math.max(feature.balance, 0)
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
						<div className="flex items-start justify-between gap-4">
							<FrameTitle>Aktiver Tarif</FrameTitle>
							<Button
								variant="outline"
								size="sm"
								onClick={() => void refetch()}
								disabled={isLoading}
							>
								<RefreshCw className="size-4" />
								Aktualisieren
							</Button>
						</div>
					</FrameHeader>

					{activeProducts.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{activeProducts.map((product) => {
								const meta =
									PLAN_META[product.id as keyof typeof PLAN_META];

								return (
									<Badge
										key={`${product.id}-${product.status}`}
										variant={meta?.variant ?? "outline"}
										size="lg"
									>
										{meta?.label || product.name || product.id}
									</Badge>
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

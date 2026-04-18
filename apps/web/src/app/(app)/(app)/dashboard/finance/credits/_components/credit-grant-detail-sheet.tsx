"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
	formatBillingDate,
	formatCents,
	getCreditGrantTypeLabel,
	type CreditGrantType,
} from "@/utils/billing";
import { orpc } from "@/utils/orpc";

interface CreditGrantDetailSheetProps {
	grantId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreditGrantDetailSheet({
	grantId,
	open,
	onOpenChange,
}: CreditGrantDetailSheetProps) {
	// Fetch from list and filter - no dedicated getGrant endpoint
	const {
		data: grants,
		isPending,
		error,
		refetch,
	} = useQuery(
		orpc.billing.listCreditGrants.queryOptions({
			input: {},
			enabled: open && !!grantId,
		}),
	);

	const grant = grants?.find((g) => g.id === grantId);

	if (!open) return null;

	// Determine if grant is exhausted
	const isExhausted = (g: typeof grant) => {
		if (!g) return false;
		if (g.type === "money") {
			return (g.remainingAmountCents ?? 0) <= 0;
		}
		return (g.remainingCycles ?? 0) <= 0;
	};

	// Determine if grant is expired
	const isExpired = (g: typeof grant) => {
		if (!g?.expiresAt) return false;
		return new Date(g.expiresAt) < new Date();
	};

	// Format remaining value
	const formatRemaining = (g: typeof grant) => {
		if (!g) return "-";
		if (g.type === "money") {
			return formatCents(g.remainingAmountCents ?? 0);
		}
		return `${g.remainingCycles ?? 0} Monate`;
	};

	// Format original value
	const formatOriginal = (g: typeof grant) => {
		if (!g) return "-";
		if (g.type === "money") {
			return formatCents(g.originalAmountCents ?? 0);
		}
		return `${g.originalCycles ?? 0} Monate`;
	};

	// Calculate usage
	const getUsage = (g: typeof grant) => {
		if (!g) return { used: "-", percentage: 0 };
		if (g.type === "money") {
			const original = g.originalAmountCents ?? 0;
			const remaining = g.remainingAmountCents ?? 0;
			const used = original - remaining;
			return {
				used: formatCents(used),
				percentage: original > 0 ? Math.round((used / original) * 100) : 0,
			};
		}
		const original = g.originalCycles ?? 0;
		const remaining = g.remainingCycles ?? 0;
		const used = original - remaining;
		return {
			used: `${used} Monate`,
			percentage: original > 0 ? Math.round((used / original) * 100) : 0,
		};
	};

	const exhausted = isExhausted(grant);
	const expired = isExpired(grant);
	const usage = getUsage(grant);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Guthaben Details</SheetTitle>
					<SheetDescription>
						{grant
							? getCreditGrantTypeLabel(grant.type as CreditGrantType)
							: "Lade..."}
					</SheetDescription>
				</SheetHeader>
				<SheetPanel>
					{isPending ? (
						<div className="space-y-4">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-32 w-full" />
						</div>
					) : error ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>Fehler beim Laden</EmptyTitle>
								<EmptyDescription>
									{error instanceof Error
										? error.message
										: "Ein Fehler ist aufgetreten."}
								</EmptyDescription>
							</EmptyHeader>
							<Button onClick={() => refetch()}>Erneut versuchen</Button>
						</Empty>
					) : grant ? (
						<div className="space-y-6">
							{/* Status */}
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Status</span>
								{exhausted ? (
									<Badge variant="outline">Aufgebraucht</Badge>
								) : expired ? (
									<Badge variant="error">Abgelaufen</Badge>
								) : (
									<Badge variant="success">Aktiv</Badge>
								)}
							</div>

							<Separator />

							{/* Type & Description */}
							<div className="space-y-4">
								<h4 className="font-semibold">Guthaben</h4>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<p className="text-muted-foreground text-sm">Typ</p>
										<p className="mt-1">
											<Badge variant="outline">
												{getCreditGrantTypeLabel(grant.type as CreditGrantType)}
											</Badge>
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">Beschreibung</p>
										<p className="mt-1">{grant.description || "-"}</p>
									</div>
								</div>
							</div>

							<Separator />

							{/* Usage */}
							<div className="space-y-4">
								<h4 className="font-semibold">Nutzung</h4>

								{/* Progress bar */}
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Verbraucht</span>
										<span className="font-mono">{usage.percentage}%</span>
									</div>
									<div className="h-2 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full bg-primary transition-all"
											style={{ width: `${usage.percentage}%` }}
										/>
									</div>
								</div>

								<div className="grid gap-4 sm:grid-cols-3">
									<div>
										<p className="text-muted-foreground text-sm">Original</p>
										<p className="mt-1 font-mono">{formatOriginal(grant)}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">Verwendet</p>
										<p className="mt-1 font-mono">{usage.used}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">Verbleibend</p>
										<p className="mt-1 font-mono">{formatRemaining(grant)}</p>
									</div>
								</div>
							</div>

							<Separator />

							{/* Validity */}
							<div className="space-y-4">
								<h4 className="font-semibold">Gültigkeit</h4>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<p className="text-muted-foreground text-sm">Gültig ab</p>
										<p className="mt-1">
											{grant.validFrom
												? formatBillingDate(grant.validFrom)
												: "Sofort"}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">Gültig bis</p>
										<p className="mt-1">
											{grant.expiresAt
												? formatBillingDate(grant.expiresAt)
												: "Unbegrenzt"}
										</p>
									</div>
								</div>
							</div>

							{/* Notes */}
							{grant.notes && (
								<>
									<Separator />
									<div className="space-y-2">
										<h4 className="font-semibold">Notizen</h4>
										<p className="text-muted-foreground text-sm whitespace-pre-wrap">
											{grant.notes}
										</p>
									</div>
								</>
							)}

							{/* Meta */}
							<Separator />
							<div className="space-y-4">
								<h4 className="font-semibold">Informationen</h4>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<p className="text-muted-foreground text-sm">Erstellt</p>
										<p className="mt-1 text-sm">
											{new Date(grant.createdAt).toLocaleString("de-DE")}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">ID</p>
										<p className="mt-1 font-mono text-xs text-muted-foreground">
											{grant.id}
										</p>
									</div>
								</div>
							</div>

							{/* Status warnings */}
							{exhausted && (
								<div className="rounded-lg border border-muted bg-muted/20 p-4">
									<div className="flex items-center gap-2">
										<Gift className="size-4 text-muted-foreground" />
										<span className="font-medium">Guthaben aufgebraucht</span>
									</div>
									<p className="mt-2 text-muted-foreground text-sm">
										Dieses Guthaben wurde vollständig verwendet und kann nicht
										mehr für neue Rechnungen angerechnet werden.
									</p>
								</div>
							)}

							{expired && !exhausted && (
								<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
									<div className="flex items-center gap-2 text-destructive">
										<AlertCircle className="size-4" />
										<span className="font-medium">Guthaben abgelaufen</span>
									</div>
									<p className="mt-2 text-muted-foreground text-sm">
										Dieses Guthaben ist am{" "}
										{formatBillingDate(grant.expiresAt ?? undefined)} abgelaufen
										und kann nicht mehr verwendet werden.
									</p>
								</div>
							)}
						</div>
					) : null}
				</SheetPanel>
				<SheetFooter>
					<SheetClose render={<Button variant="outline" />}>
						Schließen
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

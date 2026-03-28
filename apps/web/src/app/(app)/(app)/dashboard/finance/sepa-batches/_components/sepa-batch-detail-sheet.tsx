"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	AlertTriangle,
	Ban,
	Download,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	formatBillingDate,
	formatBillingPeriod,
	formatCents,
	getSepaBatchStatusLabel,
	getSepaBatchStatusVariant,
	type SepaBatchStatus,
} from "@/utils/billing";
import { client, orpc } from "@/utils/orpc";

interface SepaBatchDetailSheetProps {
	batchId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SepaBatchDetailSheet({
	batchId,
	open,
	onOpenChange,
}: SepaBatchDetailSheetProps) {
	const queryClient = useQueryClient();

	const { data, isPending, error, refetch } = useQuery(
		orpc.billing.getSepaBatch.queryOptions({
			input: { id: batchId ?? "" },
			enabled: open && !!batchId,
		}),
	);

	const downloadMutation = useMutation({
		mutationFn: async () => {
			if (!batchId) throw new Error("No batch selected");
			return client.billing.downloadSepaBatch({ id: batchId });
		},
		onSuccess: (data) => {
			const blob = new Blob([data.xml], { type: "application/xml" });
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `sepa-${data.batch.batchNumber}.xml`;
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(url);

			toast.success("XML heruntergeladen");
			queryClient.invalidateQueries({
				queryKey: orpc.billing.listSepaBatches.queryKey({ input: {} }),
			});
			refetch();
		},
		onError: (error) => {
			toast.error("Fehler", {
				description:
					error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
			});
		},
	});

	const voidMutation = useMutation({
		mutationFn: async () => {
			if (!batchId) throw new Error("No batch selected");
			return client.billing.voidSepaBatch({ id: batchId });
		},
		onSuccess: () => {
			toast.success("Batch storniert");
			queryClient.invalidateQueries({
				queryKey: orpc.billing.listSepaBatches.queryKey({ input: {} }),
			});
			refetch();
		},
		onError: (error) => {
			toast.error("Fehler beim Stornieren", {
				description:
					error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
			});
		},
	});

	const supersedeMutation = useMutation({
		mutationFn: async () => {
			if (!batchId) throw new Error("No batch selected");
			return client.billing.supersedeSepaBatch({ id: batchId });
		},
		onSuccess: () => {
			toast.success("Batch als ersetzt markiert");
			queryClient.invalidateQueries({
				queryKey: orpc.billing.listSepaBatches.queryKey({ input: {} }),
			});
			refetch();
		},
		onError: (error) => {
			toast.error("Fehler", {
				description:
					error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
			});
		},
	});

	const isActive =
		data?.batch?.status === "generated" ||
		data?.batch?.status === "downloaded";
	const canDownload =
		data?.batch?.status === "generated" ||
		data?.batch?.status === "downloaded";

	if (!open) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-2xl">
				<SheetHeader>
					<SheetTitle>SEPA-Batch Details</SheetTitle>
					<SheetDescription>
						{data?.batch?.batchNumber ?? "Lade..."}
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
					) : data ? (
						<div className="space-y-6">
							{/* Batch Header Info */}
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<p className="text-muted-foreground text-sm">Status</p>
									<div className="mt-1">
										<Badge
											variant={getSepaBatchStatusVariant(
												data.batch.status as SepaBatchStatus,
											)}
										>
											{getSepaBatchStatusLabel(
												data.batch.status as SepaBatchStatus,
											)}
										</Badge>
									</div>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Einzugsdatum</p>
									<p className="mt-1 font-medium">
										{formatBillingDate(data.batch.collectionDate)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Transaktionen</p>
									<p className="mt-1">{data.batch.transactionCount}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Gesamtbetrag</p>
									<p className="mt-1 font-mono text-lg font-semibold">
										{formatCents(data.batch.totalAmountCents)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">
										Sequenznummer
									</p>
									<p className="mt-1">{data.batch.sequenceNumber}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Erstellt</p>
									<p className="mt-1 text-sm">
										{new Date(data.batch.createdAt).toLocaleString("de-DE")}
									</p>
								</div>
							</div>

							{/* Notes */}
							{data.batch.notes && (
								<div className="rounded-lg border bg-muted/50 p-4">
									<p className="font-medium text-sm">Notizen</p>
									<p className="mt-1 text-muted-foreground text-sm">
										{data.batch.notes}
									</p>
								</div>
							)}

							{/* Warning for active batches */}
							{isActive && (
								<div className="rounded-lg border border-warning/50 bg-warning/5 p-4">
									<div className="flex items-center gap-2 text-warning-foreground">
										<AlertTriangle className="size-4" />
										<span className="font-medium">Irreversibel</span>
									</div>
									<p className="mt-2 text-muted-foreground text-sm">
										Dieser Batch wurde generiert und möglicherweise bereits an
										die Bank übermittelt. Änderungen an exportierten Rechnungen
										erfolgen durch neue Buchungen, nicht durch Bearbeitung.
									</p>
								</div>
							)}

							<Separator />

							{/* Batch Items */}
							<div>
								<h4 className="mb-3 font-semibold">Enthaltene Rechnungen</h4>
								{data.items.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										Keine Positionen
									</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Mitglied</TableHead>
												<TableHead>Zeitraum</TableHead>
												<TableHead>Mandat</TableHead>
												<TableHead className="text-right">Betrag</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{data.items.map((item) => (
												<TableRow key={item.id}>
													<TableCell>
														{item.memberFirstName} {item.memberLastName}
													</TableCell>
													<TableCell>
														{formatBillingPeriod(
															item.billingPeriodStart,
															item.billingPeriodEnd,
														)}
													</TableCell>
													<TableCell className="font-mono text-xs">
														{item.mandateReference ?? "-"}
													</TableCell>
													<TableCell className="text-right font-mono">
														{formatCents(item.amountCents)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</div>
						</div>
					) : null}
				</SheetPanel>
				<SheetFooter>
					{canDownload && (
						<Button
							variant="outline"
							onClick={() => downloadMutation.mutate()}
							disabled={downloadMutation.isPending}
						>
							<Download className="size-4" />
							{downloadMutation.isPending ? "..." : "XML herunterladen"}
						</Button>
					)}
					{isActive && (
						<>
							{data?.batch?.status === "downloaded" && (
								<Button
									variant="outline"
									onClick={() => supersedeMutation.mutate()}
									disabled={supersedeMutation.isPending}
								>
									<RefreshCw className="size-4" />
									Ersetzen
								</Button>
							)}
							<Button
								variant="destructive"
								onClick={() => voidMutation.mutate()}
								disabled={voidMutation.isPending}
							>
								<Ban className="size-4" />
								Stornieren
							</Button>
						</>
					)}
					<SheetClose render={<Button variant="outline" />}>
						Schließen
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

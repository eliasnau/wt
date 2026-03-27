"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Ban, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
	formatBillingDate,
	formatBillingPeriod,
	formatCents,
	getInvoiceLineTypeLabel,
	getInvoiceLineTypeVariant,
	getInvoiceStatusLabel,
	getInvoiceStatusVariant,
	getSepaBatchStatusLabel,
	getSepaBatchStatusVariant,
	type InvoiceLineType,
	type InvoiceStatus,
	type SepaBatchStatus,
} from "@/utils/billing";
import { client, orpc } from "@/utils/orpc";

interface InvoiceDetailSheetProps {
	invoiceId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailSheet({
	invoiceId,
	open,
	onOpenChange,
}: InvoiceDetailSheetProps) {
	const queryClient = useQueryClient();
	const [voidDialogOpen, setVoidDialogOpen] = useState(false);
	const [voidReason, setVoidReason] = useState("");

	const { data, isPending, error, refetch } = useQuery(
		orpc.billing.getInvoice.queryOptions({
			input: { id: invoiceId ?? "" },
			enabled: open && !!invoiceId,
		}),
	);

	const voidMutation = useMutation({
		mutationFn: async (reason: string) => {
			if (!invoiceId) throw new Error("No invoice selected");
			return client.billing.voidInvoice({ id: invoiceId, reason });
		},
		onSuccess: () => {
			toast.success("Rechnung storniert");
			setVoidDialogOpen(false);
			setVoidReason("");
			queryClient.invalidateQueries({
				queryKey: orpc.billing.listInvoices.queryKey({ input: {} }),
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

	// Check if invoice is exported (cannot be voided/replaced)
	const isExported =
		data?.sepaBatchItems?.some(
			(item) =>
				item.batchStatus === "generated" || item.batchStatus === "downloaded",
		) ?? false;

	const canModify =
		data?.invoice?.status === "finalized" && !isExported;

	if (!open) return null;

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="right" className="sm:max-w-xl">
					<SheetHeader>
						<SheetTitle>Rechnungsdetails</SheetTitle>
						<SheetDescription>
							{data?.invoice
								? formatBillingPeriod(
										data.invoice.billingPeriodStart,
										data.invoice.billingPeriodEnd,
									)
								: "Lade..."}
						</SheetDescription>
					</SheetHeader>
					<SheetPanel>
						{isPending ? (
							<div className="space-y-4">
								<Skeleton className="h-20 w-full" />
								<Skeleton className="h-32 w-full" />
								<Skeleton className="h-20 w-full" />
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
								{/* Invoice Header Info */}
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<p className="text-muted-foreground text-sm">Status</p>
										<div className="mt-1">
											<Badge
												variant={getInvoiceStatusVariant(
													data.invoice.status as InvoiceStatus,
												)}
											>
												{getInvoiceStatusLabel(
													data.invoice.status as InvoiceStatus,
												)}
											</Badge>
										</div>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">Währung</p>
										<p className="mt-1">{data.invoice.currency}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">Gesamtbetrag</p>
										<p className="mt-1 font-mono text-lg font-semibold">
											{formatCents(data.invoice.totalCents, data.invoice.currency)}
										</p>
									</div>
								</div>

								{/* Void reason if voided */}
								{data.invoice.status === "void" && data.invoice.voidReason && (
									<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
										<div className="flex items-center gap-2 text-destructive">
											<Ban className="size-4" />
											<span className="font-medium">Stornierungsgrund</span>
										</div>
										<p className="mt-2 text-sm">{data.invoice.voidReason}</p>
									</div>
								)}

								{/* Exported warning */}
								{isExported && (
									<div className="rounded-lg border border-warning/50 bg-warning/5 p-4">
										<div className="flex items-center gap-2 text-warning-foreground">
											<AlertTriangle className="size-4" />
											<span className="font-medium">Bereits exportiert</span>
										</div>
										<p className="mt-2 text-muted-foreground text-sm">
											Diese Rechnung wurde bereits in einem SEPA-Batch exportiert
											und kann nicht mehr direkt geändert werden.
										</p>
									</div>
								)}

								<Separator />

								{/* Invoice Lines */}
								<div>
									<h4 className="mb-3 font-semibold">Rechnungspositionen</h4>
									{data.lines.length === 0 ? (
										<p className="text-muted-foreground text-sm">
											Keine Positionen
										</p>
									) : (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Typ</TableHead>
													<TableHead>Beschreibung</TableHead>
													<TableHead className="text-right">Betrag</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{data.lines.map((line) => (
													<TableRow key={line.id}>
														<TableCell>
															<Badge
																variant={getInvoiceLineTypeVariant(
																	line.type as InvoiceLineType,
																)}
																size="sm"
															>
																{getInvoiceLineTypeLabel(
																	line.type as InvoiceLineType,
																)}
															</Badge>
														</TableCell>
														<TableCell className="max-w-[200px] truncate">
															{line.description}
														</TableCell>
														<TableCell
															className={`text-right font-mono ${line.totalAmountCents < 0 ? "text-success-foreground" : ""}`}
														>
															{formatCents(
																line.totalAmountCents,
																data.invoice.currency,
															)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									)}
								</div>

								{/* SEPA Batch History */}
								{data.sepaBatchItems.length > 0 && (
									<>
										<Separator />
										<div>
											<h4 className="mb-3 font-semibold">SEPA-Export-Verlauf</h4>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Batch</TableHead>
														<TableHead>Einzugsdatum</TableHead>
														<TableHead>Status</TableHead>
														<TableHead>Mandat</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{data.sepaBatchItems.map((item) => (
														<TableRow key={item.id}>
															<TableCell className="font-mono text-xs">
																{item.batchNumber}
															</TableCell>
															<TableCell>
																{formatBillingDate(item.collectionDate)}
															</TableCell>
															<TableCell>
																<Badge
																	variant={getSepaBatchStatusVariant(
																		item.batchStatus as SepaBatchStatus,
																	)}
																	size="sm"
																>
																	{getSepaBatchStatusLabel(
																		item.batchStatus as SepaBatchStatus,
																	)}
																</Badge>
															</TableCell>
															<TableCell className="font-mono text-xs">
																{item.mandateReference}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</>
								)}
							</div>
						) : null}
					</SheetPanel>
					<SheetFooter>
						{canModify && (
							<Button
								variant="destructive"
								onClick={() => setVoidDialogOpen(true)}
							>
								<Ban className="size-4" />
								Stornieren
							</Button>
						)}
						<DialogClose render={<Button variant="outline" />}>
							Schließen
						</DialogClose>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			{/* Void Dialog */}
			<Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rechnung stornieren</DialogTitle>
						<DialogDescription>
							Diese Aktion kann nicht rückgängig gemacht werden. Die Rechnung
							wird als storniert markiert.
						</DialogDescription>
					</DialogHeader>
					<DialogPanel>
						<div className="space-y-4">
							<div>
								<label
									htmlFor="void-reason"
									className="mb-2 block font-medium text-sm"
								>
									Grund für die Stornierung
								</label>
								<Textarea
									id="void-reason"
									value={voidReason}
									onChange={(e) => setVoidReason(e.target.value)}
									placeholder="Bitte geben Sie einen Grund an..."
									rows={3}
								/>
							</div>
						</div>
					</DialogPanel>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" />}>
							Abbrechen
						</DialogClose>
						<Button
							variant="destructive"
							onClick={() => voidMutation.mutate(voidReason)}
							disabled={!voidReason.trim() || voidMutation.isPending}
						>
							{voidMutation.isPending ? "Wird storniert..." : "Stornieren"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

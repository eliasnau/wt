"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	AlertTriangle,
	Check,
	Download,
	Eye,
	X,
} from "lucide-react";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	formatBillingPeriod,
	formatCents,
	getExclusionReasonLabel,
	getExclusionReasonVariant,
	getTodayDateString,
	type ExclusionReason,
} from "@/utils/billing";
import { client, orpc } from "@/utils/orpc";

export function GenerateSepaBatchButton() {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<"date" | "preview">("date");
	const [collectionDate, setCollectionDate] = useState(getTodayDateString());
	const [notes, setNotes] = useState("");

	const previewQuery = useQuery(
		orpc.billing.previewSepaBatch.queryOptions({
			input: {},
			enabled: open && step === "preview",
		}),
	);

	const generateMutation = useMutation({
		mutationFn: async () => {
			return client.billing.generateSepaBatch({
				collectionDate,
				notes: notes.trim() || undefined,
			});
		},
		onSuccess: (data) => {
			toast.success("Lastschriftlauf erzeugt", {
				description: `${data.includedInvoices.length} Rechnungen wurden dem Batch hinzugefügt.`,
			});
			setOpen(false);
			setStep("date");
			setNotes("");
			queryClient.invalidateQueries({
				queryKey: orpc.billing.listSepaBatches.queryKey({ input: {} }),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.billing.listInvoices.queryKey({ input: {} }),
			});
		},
		onError: (error) => {
			toast.error("Fehler beim Generieren", {
				description:
					error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
			});
		},
	});

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setStep("date");
			setNotes("");
		}
	};

	const handlePreview = () => {
		setStep("preview");
	};

	const handleBack = () => {
		setStep("date");
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger render={<Button />}>
				<Download className="size-4" />
				Lastschrift erzeugen
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{step === "date"
							? "Lastschrift erzeugen"
							: "Lastschrift Vorschau"}
					</DialogTitle>
					<DialogDescription>
						{step === "date"
							? "Wählen Sie das Einzugsdatum für den SEPA-Lastschrifteinzug."
							: "Prüfen Sie die Vorschau bevor Sie die Lastschrift erzeugen."}
					</DialogDescription>
				</DialogHeader>
				<DialogPanel>
					{step === "date" ? (
						<div className="space-y-4">
							<div>
								<label
									htmlFor="collection-date"
									className="mb-2 block font-medium text-sm"
								>
									Einzugsdatum
								</label>
								<Input
									id="collection-date"
									type="date"
									value={collectionDate}
									onChange={(e) => setCollectionDate(e.target.value)}
								/>
								<p className="mt-1 text-muted-foreground text-xs">
									Das Datum, an dem die Lastschrift von den Konten eingezogen
									wird.
								</p>
							</div>
							<div>
								<label
									htmlFor="batch-notes"
									className="mb-2 block font-medium text-sm"
								>
									Notizen (optional)
								</label>
								<Textarea
									id="batch-notes"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder="Interne Notizen zum Batch..."
									rows={2}
								/>
							</div>
							<div className="rounded-lg border border-warning/50 bg-warning/5 p-3">
								<div className="flex items-center gap-2 text-warning-foreground">
									<AlertTriangle className="size-4" />
									<span className="font-medium text-sm">Wichtig</span>
								</div>
								<p className="mt-1 text-muted-foreground text-sm">
									Die Batch-Zusammensetzung wird gespeichert. Die XML-Datei wird
									erst beim Herunterladen erzeugt.
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{previewQuery.isPending ? (
								<div className="space-y-4">
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-32 w-full" />
								</div>
							) : previewQuery.error ? (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<AlertCircle />
										</EmptyMedia>
										<EmptyTitle>Fehler beim Laden der Vorschau</EmptyTitle>
										<EmptyDescription>
											{previewQuery.error instanceof Error
												? previewQuery.error.message
												: "Ein Fehler ist aufgetreten."}
										</EmptyDescription>
									</EmptyHeader>
									<Button onClick={() => previewQuery.refetch()}>
										Erneut versuchen
									</Button>
								</Empty>
							) : previewQuery.data ? (
								<>
									{/* Summary */}
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="rounded-lg border bg-success/5 p-4">
											<div className="flex items-center gap-2">
												<Check className="size-4 text-success-foreground" />
												<span className="font-medium">
													{previewQuery.data.includedInvoices.length} Rechnungen
												</span>
											</div>
											<p className="mt-1 text-muted-foreground text-sm">
												werden exportiert
											</p>
											<p className="mt-2 font-mono text-lg font-semibold">
												{formatCents(
													previewQuery.data.includedInvoices.reduce(
														(sum, inv) => sum + inv.totalCents,
														0,
													),
												)}
											</p>
										</div>
										<div className="rounded-lg border bg-muted/50 p-4">
											<div className="flex items-center gap-2">
												<X className="size-4 text-muted-foreground" />
												<span className="font-medium">
													{previewQuery.data.excludedInvoices.length} Rechnungen
												</span>
											</div>
											<p className="mt-1 text-muted-foreground text-sm">
												werden übersprungen
											</p>
										</div>
									</div>

									{/* Tabs for included/excluded */}
									<Tabs defaultValue="included">
										<TabsList>
											<TabsTrigger value="included">
												Eingeschlossen ({previewQuery.data.includedInvoices.length})
											</TabsTrigger>
											<TabsTrigger value="excluded">
												Ausgeschlossen ({previewQuery.data.excludedInvoices.length})
											</TabsTrigger>
										</TabsList>
										<TabsContent value="included" className="mt-4">
											{previewQuery.data.includedInvoices.length === 0 ? (
												<Empty className="py-8">
													<EmptyHeader>
														<EmptyTitle>Keine Rechnungen</EmptyTitle>
														<EmptyDescription>
															Es gibt keine Rechnungen zum Exportieren.
														</EmptyDescription>
													</EmptyHeader>
												</Empty>
											) : (
												<Frame>
													<FramePanel className="max-h-64 overflow-auto p-0">
														<Table>
															<TableHeader>
																<TableRow>
																	<TableHead>Mitglied</TableHead>
																	<TableHead>Zeitraum</TableHead>
																	<TableHead className="text-right">
																		Betrag
																	</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{previewQuery.data.includedInvoices.map(
																	(invoice) => (
																		<TableRow key={invoice.id}>
																			<TableCell>
																				{invoice.memberFirstName}{" "}
																				{invoice.memberLastName}
																			</TableCell>
																			<TableCell>
																				{formatBillingPeriod(
																					invoice.billingPeriodStart,
																					invoice.billingPeriodEnd,
																				)}
																			</TableCell>
																			<TableCell className="text-right font-mono">
																				{formatCents(invoice.totalCents)}
																			</TableCell>
																		</TableRow>
																	),
																)}
															</TableBody>
														</Table>
													</FramePanel>
												</Frame>
											)}
										</TabsContent>
										<TabsContent value="excluded" className="mt-4">
											{previewQuery.data.excludedInvoices.length === 0 ? (
												<Empty className="py-8">
													<EmptyHeader>
														<EmptyTitle>Keine ausgeschlossenen Rechnungen</EmptyTitle>
														<EmptyDescription>
															Alle fälligen Rechnungen können exportiert werden.
														</EmptyDescription>
													</EmptyHeader>
												</Empty>
											) : (
												<Frame>
													<FramePanel className="max-h-64 overflow-auto p-0">
														<Table>
															<TableHeader>
																<TableRow>
																	<TableHead>Mitglied</TableHead>
																	<TableHead>Zeitraum</TableHead>
																	<TableHead>Grund</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{previewQuery.data.excludedInvoices.map(
																	(invoice) => (
																		<TableRow key={invoice.id}>
																			<TableCell>
																				{invoice.memberFirstName}{" "}
																				{invoice.memberLastName}
																			</TableCell>
																			<TableCell>
																				{formatBillingPeriod(
																					invoice.billingPeriodStart,
																					invoice.billingPeriodEnd,
																				)}
																			</TableCell>
																			<TableCell>
																				<Badge
																					variant={getExclusionReasonVariant(
																						invoice.reason as ExclusionReason,
																					)}
																					size="sm"
																				>
																					{getExclusionReasonLabel(
																						invoice.reason as ExclusionReason,
																					)}
																				</Badge>
																			</TableCell>
																		</TableRow>
																	),
																)}
															</TableBody>
														</Table>
													</FramePanel>
												</Frame>
											)}
										</TabsContent>
									</Tabs>
								</>
							) : null}
						</div>
					)}
				</DialogPanel>
				<DialogFooter>
					{step === "date" ? (
						<>
							<DialogClose render={<Button variant="outline" />}>
								Abbrechen
							</DialogClose>
							<Button onClick={handlePreview} disabled={!collectionDate}>
								<Eye className="size-4" />
								Vorschau
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" onClick={handleBack}>
								Zurück
							</Button>
							<Button
								onClick={() => generateMutation.mutate()}
								disabled={
									generateMutation.isPending ||
									previewQuery.isPending ||
									!previewQuery.data?.includedInvoices.length
								}
							>
								<Download className="size-4" />
								{generateMutation.isPending
									? "Erzeuge..."
									: `${previewQuery.data?.includedInvoices.length ?? 0} Rechnungen in Batch aufnehmen`}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronDownIcon, CreditCard, Gift, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
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
	formatBillingDateShort,
	formatCents,
	getCreditGrantTypeLabel,
	getInvoiceStatusLabel,
	getInvoiceStatusVariant,
	getMonthLabel,
	type CreditGrantType,
	type InvoiceStatus,
} from "@/utils/billing";
import { orpc } from "@/utils/orpc";
import { CreateCreditGrantButton } from "../../../finance/credits/_components/create-credit-grant-button";
import { CreditGrantDetailSheet } from "../../../finance/credits/_components/credit-grant-detail-sheet";
import { InvoiceDetailSheet } from "../../../finance/invoices/_components/invoice-detail-sheet";
import { UpdateBillingInfoSheet } from "./update-billing-info-sheet";

interface MemberBillingSectionProps {
	memberId: string;
	contractId: string;
	memberName: string;
}

export function MemberBillingSection({
	memberId,
	contractId,
	memberName,
}: MemberBillingSectionProps) {
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
		null,
	);
	const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);
	const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
	const [grantSheetOpen, setGrantSheetOpen] = useState(false);
	const [billingSheetOpen, setBillingSheetOpen] = useState(false);

	const invoicesQuery = useQuery(
		orpc.billing.listInvoices.queryOptions({
			input: { contractId },
		}),
	);

	const creditsQuery = useQuery(
		orpc.billing.listCreditGrants.queryOptions({
			input: { contractId },
		}),
	);

	const mandatesQuery = useQuery(
		orpc.billing.listSepaMandates.queryOptions({
			input: { contractId },
		}),
	);

	const handleSelectInvoice = (invoiceId: string) => {
		setSelectedInvoiceId(invoiceId);
		setInvoiceSheetOpen(true);
	};

	const handleSelectGrant = (grantId: string) => {
		setSelectedGrantId(grantId);
		setGrantSheetOpen(true);
	};

	// Format IBAN with spaces
	const formatIbanDisplay = (iban: string) => {
		return iban.replace(/(.{4})/g, "$1 ").trim();
	};
	const invoicePreview = [...(invoicesQuery.data ?? [])].slice(0, 5);
	const activeMandate = mandatesQuery.data?.find((mandate) => mandate.isActive);

	return (
		<div className="space-y-4">
			<Frame>
				<Collapsible defaultOpen={true}>
					<FrameHeader className="flex-row items-center justify-between px-2 py-2">
						<CollapsibleTrigger
							className="data-panel-open:[&_svg:first-child]:rotate-180"
							render={<Button variant="ghost" />}
						>
							<ChevronDownIcon className="size-4" />
							<CreditCard className="size-4" />
							Zahlungsinformationen
						</CollapsibleTrigger>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setBillingSheetOpen(true)}
						>
							Zahlungsdaten bearbeiten
						</Button>
					</FrameHeader>
					<CollapsiblePanel>
						<FramePanel>
							{mandatesQuery.isPending ? (
								<div className="grid gap-4 md:grid-cols-2">
									<Skeleton className="h-14 w-full" />
									<Skeleton className="h-14 w-full" />
									<Skeleton className="h-14 w-full" />
									<Skeleton className="h-14 w-full" />
								</div>
							) : mandatesQuery.error ? (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<CreditCard />
										</EmptyMedia>
										<EmptyTitle>Keine Berechtigung</EmptyTitle>
										<EmptyDescription>
											Du hast keine Berechtigung, Zahlungsinformationen anzuzeigen.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							) : activeMandate ? (
								<div className="grid gap-6 md:grid-cols-2">
									<div>
										<p className="font-medium text-muted-foreground text-sm">IBAN</p>
										<p className="mt-1 font-mono text-sm">
											{formatIbanDisplay(activeMandate.iban)}
										</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">BIC</p>
										<p className="mt-1 font-mono text-sm">
											{activeMandate.bic}
										</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Kontoinhaber
										</p>
										<p className="mt-1 text-sm">{activeMandate.accountHolder}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Mandatsstatus
										</p>
										<div className="mt-1 flex items-center gap-2">
											<Badge variant={activeMandate.isActive ? "success" : "error"}>
												{activeMandate.isActive ? "Aktiv" : "Widerrufen"}
											</Badge>
										</div>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Mandatsreferenz
										</p>
										<p className="mt-1 text-sm">{activeMandate.mandateReference}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Unterschrieben am
										</p>
										<p className="mt-1 text-sm">
											{formatBillingDateShort(activeMandate.signatureDate)}
										</p>
									</div>
								</div>
							) : (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<CreditCard />
										</EmptyMedia>
										<EmptyTitle>Keine Zahlungsdaten vorhanden</EmptyTitle>
										<EmptyDescription>
											Für dieses Mitglied ist aktuell kein aktives
											SEPA-Mandat hinterlegt.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							)}
						</FramePanel>
					</CollapsiblePanel>
				</Collapsible>
			</Frame>

			<Frame>
				<Collapsible defaultOpen={true}>
					<FrameHeader className="flex-row items-center justify-between px-2 py-2">
						<CollapsibleTrigger
							className="data-panel-open:[&_svg:first-child]:rotate-180"
							render={<Button variant="ghost" />}
						>
							<ChevronDownIcon className="size-4" />
							<Receipt className="size-4" />
							Rechnungen
						</CollapsibleTrigger>
						<Button
							variant="outline"
							size="sm"
							render={<Link href={`/dashboard/members/${memberId}/invoices`} />}
						>
							Alle ansehen
						</Button>
					</FrameHeader>
					<CollapsiblePanel>
						<FramePanel>
							{invoicesQuery.isPending ? (
								<div className="space-y-2">
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
								</div>
							) : invoicesQuery.error ? (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<AlertCircle />
										</EmptyMedia>
										<EmptyTitle>Fehler beim Laden</EmptyTitle>
										<EmptyDescription>
											{invoicesQuery.error instanceof Error
												? invoicesQuery.error.message
												: "Ein Fehler ist aufgetreten."}
										</EmptyDescription>
									</EmptyHeader>
									<Button onClick={() => invoicesQuery.refetch()}>
										Erneut versuchen
									</Button>
								</Empty>
							) : !invoicePreview.length ? (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Receipt />
										</EmptyMedia>
										<EmptyTitle>Keine Rechnungen</EmptyTitle>
										<EmptyDescription>
											Es wurden noch keine Rechnungen für dieses Mitglied erstellt.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Zeitraum</TableHead>
												<TableHead>Status</TableHead>
												<TableHead className="text-right">Betrag</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{invoicePreview.map((invoice) => (
												<TableRow
													key={invoice.id}
													className="cursor-pointer"
													onClick={() => handleSelectInvoice(invoice.id)}
												>
													<TableCell>{getMonthLabel(invoice.billingPeriodStart)}</TableCell>
													<TableCell>
														<Badge
															variant={getInvoiceStatusVariant(
																invoice.status as InvoiceStatus,
															)}
														>
															{getInvoiceStatusLabel(
																invoice.status as InvoiceStatus,
															)}
														</Badge>
													</TableCell>
													<TableCell className="text-right font-mono">
														{formatCents(invoice.totalCents ?? 0)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</FramePanel>
					</CollapsiblePanel>
				</Collapsible>
			</Frame>

			<Frame>
				<Collapsible defaultOpen={false}>
					<FrameHeader className="flex-row items-center justify-between px-2 py-2">
						<CollapsibleTrigger
							className="data-panel-open:[&_svg:first-child]:rotate-180"
							render={<Button variant="ghost" />}
						>
							<ChevronDownIcon className="size-4" />
							<Gift className="size-4" />
							Guthaben
						</CollapsibleTrigger>
						<CreateCreditGrantButton
							memberId={memberId}
							contractId={contractId}
							memberName={memberName}
						/>
					</FrameHeader>
					<CollapsiblePanel>
						<FramePanel>
							{creditsQuery.isPending ? (
								<div className="space-y-2">
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
								</div>
							) : creditsQuery.error ? (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<AlertCircle />
										</EmptyMedia>
										<EmptyTitle>Fehler beim Laden</EmptyTitle>
										<EmptyDescription>
											{creditsQuery.error instanceof Error
												? creditsQuery.error.message
												: "Ein Fehler ist aufgetreten."}
										</EmptyDescription>
									</EmptyHeader>
									<Button onClick={() => creditsQuery.refetch()}>
										Erneut versuchen
									</Button>
								</Empty>
							) : !creditsQuery.data?.length ? (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Gift />
										</EmptyMedia>
										<EmptyTitle>Keine Guthaben</EmptyTitle>
										<EmptyDescription>
											Es wurden noch keine Guthaben für dieses Mitglied vergeben.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Typ</TableHead>
												<TableHead>Beschreibung</TableHead>
												<TableHead>Verbleibend</TableHead>
												<TableHead>Status</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{creditsQuery.data.map((grant) => {
												const isExhausted =
													grant.type === "money"
														? (grant.remainingAmountCents ?? 0) <= 0
														: (grant.remainingCycles ?? 0) <= 0;
												const isExpired =
													grant.expiresAt && new Date(grant.expiresAt) < new Date();
												const remaining =
													grant.type === "money"
														? formatCents(grant.remainingAmountCents ?? 0)
														: `${grant.remainingCycles ?? 0} Monate`;

												return (
													<TableRow
														key={grant.id}
														className="cursor-pointer"
														onClick={() => handleSelectGrant(grant.id)}
													>
														<TableCell>
															<Badge variant="outline">
																{getCreditGrantTypeLabel(
																	grant.type as CreditGrantType,
																)}
															</Badge>
														</TableCell>
														<TableCell className="max-w-[150px] truncate">
															{grant.description || "-"}
														</TableCell>
														<TableCell className="font-mono">
															{remaining}
														</TableCell>
														<TableCell>
															{isExhausted ? (
																<Badge variant="outline">Aufgebraucht</Badge>
															) : isExpired ? (
																<Badge variant="error">Abgelaufen</Badge>
															) : (
																<Badge variant="success">Aktiv</Badge>
															)}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							)}
						</FramePanel>
					</CollapsiblePanel>
				</Collapsible>
			</Frame>

			<InvoiceDetailSheet
				invoiceId={selectedInvoiceId}
				open={invoiceSheetOpen}
				onOpenChange={setInvoiceSheetOpen}
			/>

			<CreditGrantDetailSheet
				grantId={selectedGrantId}
				open={grantSheetOpen}
				onOpenChange={setGrantSheetOpen}
			/>

			<UpdateBillingInfoSheet
				memberId={memberId}
				contractId={contractId}
				open={billingSheetOpen}
				onOpenChange={setBillingSheetOpen}
				initialValues={
					activeMandate
						? {
								accountHolder: activeMandate.accountHolder,
								iban: activeMandate.iban,
								bic: activeMandate.bic,
							}
						: undefined
				}
			/>
		</div>
	);
}

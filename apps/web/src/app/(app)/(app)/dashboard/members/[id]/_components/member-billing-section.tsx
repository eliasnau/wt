"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FileText, Gift, Receipt } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
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

	return (
		<div className="space-y-4">
			<Tabs defaultValue="invoices">
				<TabsList>
					<TabsTrigger value="invoices">Rechnungen</TabsTrigger>
					<TabsTrigger value="credits">Guthaben</TabsTrigger>
					<TabsTrigger value="mandate">SEPA-Mandat</TabsTrigger>
				</TabsList>

				{/* Invoices Tab */}
				<TabsContent value="invoices" className="mt-4">
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
					) : !invoicesQuery.data?.length ? (
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
									{invoicesQuery.data.map((invoice) => (
											<TableRow
												key={invoice.id}
												className="cursor-pointer"
												onClick={() => handleSelectInvoice(invoice.id)}
											>
												<TableCell>
													{getMonthLabel(invoice.billingPeriodStart)}
												</TableCell>
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
				</TabsContent>

				{/* Credits Tab */}
				<TabsContent value="credits" className="mt-4">
					<div className="mb-4 flex justify-end">
						<CreateCreditGrantButton
							memberId={memberId}
							contractId={contractId}
							memberName={memberName}
						/>
					</div>
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
												<TableCell className="font-mono">{remaining}</TableCell>
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
				</TabsContent>

				{/* Mandate Tab */}
				<TabsContent value="mandate" className="mt-4">
					{mandatesQuery.isPending ? (
						<Skeleton className="h-20 w-full" />
					) : mandatesQuery.error ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>Fehler beim Laden</EmptyTitle>
								<EmptyDescription>
									{mandatesQuery.error instanceof Error
										? mandatesQuery.error.message
										: "Ein Fehler ist aufgetreten."}
								</EmptyDescription>
							</EmptyHeader>
							<Button onClick={() => mandatesQuery.refetch()}>
								Erneut versuchen
							</Button>
						</Empty>
					) : !mandatesQuery.data?.length ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<FileText />
								</EmptyMedia>
								<EmptyTitle>Kein SEPA-Mandat</EmptyTitle>
								<EmptyDescription>
									Für dieses Mitglied liegt kein aktives SEPA-Mandat vor.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<div className="space-y-4">
							{mandatesQuery.data.map((mandate) => (
								<div
									key={mandate.id}
									className={`rounded-lg border p-4 ${
										mandate.isActive
											? "border-border"
											: "border-muted bg-muted/20"
									}`}
								>
									<div className="flex items-start justify-between">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<span className="font-medium">
													{mandate.accountHolder}
												</span>
												<Badge
													variant={mandate.isActive ? "success" : "error"}
												>
													{mandate.isActive ? "Aktiv" : "Widerrufen"}
												</Badge>
											</div>
											<p className="font-mono text-muted-foreground text-sm">
												{formatIbanDisplay(mandate.iban)}
											</p>
										</div>
										<div className="text-right text-sm">
											<p className="text-muted-foreground">Mandatsreferenz</p>
											<p className="font-mono">{mandate.mandateReference}</p>
										</div>
									</div>
									<div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
										<div>
											<p className="text-muted-foreground">BIC</p>
											<p className="font-mono">{mandate.bic}</p>
										</div>
										<div>
											<p className="text-muted-foreground">Unterschrift</p>
											<p>{formatBillingDateShort(mandate.signatureDate)}</p>
										</div>
										{mandate.revokedAt && (
											<div>
												<p className="text-muted-foreground">Widerrufen</p>
												<p>
													{new Date(mandate.revokedAt).toLocaleDateString(
														"de-DE",
													)}
												</p>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

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
		</div>
	);
}

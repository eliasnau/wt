"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type InvoiceStatus, getInvoiceStatusLabel } from "@/utils/billing";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { GenerateInvoicesButton } from "./_components/generate-invoices-button";
import { InvoiceDetailSheet } from "./_components/invoice-detail-sheet";
import { InvoicesTable } from "./_components/invoices-table";

export default function InvoicesPage() {
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
		null,
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
		"all",
	);

	const handleSelectInvoice = (invoiceId: string) => {
		setSelectedInvoiceId(invoiceId);
		setSheetOpen(true);
	};

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Rechnungen</HeaderTitle>
					<HeaderDescription>
						Übersicht aller Rechnungen. Rechnungen sind die zentrale
						Abrechnungswahrheit im System.
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Select
						value={statusFilter}
						onValueChange={(value) =>
							setStatusFilter(value as InvoiceStatus | "all")
						}
					>
						<SelectTrigger className="w-[160px]">
							<SelectValue placeholder="Status filtern" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Alle Status</SelectItem>
							<SelectItem value="finalized">
								{getInvoiceStatusLabel("finalized")}
							</SelectItem>
							<SelectItem value="draft">
								{getInvoiceStatusLabel("draft")}
							</SelectItem>
							<SelectItem value="void">
								{getInvoiceStatusLabel("void")}
							</SelectItem>
						</SelectContent>
					</Select>
					<GenerateInvoicesButton />
				</HeaderActions>
			</Header>

			<InvoicesTable
				onSelectInvoice={handleSelectInvoice}
				statusFilter={statusFilter === "all" ? undefined : statusFilter}
			/>

			<InvoiceDetailSheet
				invoiceId={selectedInvoiceId}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
}

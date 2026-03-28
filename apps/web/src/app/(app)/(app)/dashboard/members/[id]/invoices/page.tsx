"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type InvoiceStatus, getInvoiceStatusLabel } from "@/utils/billing";
import { orpc } from "@/utils/orpc";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../../_components/page-header";
import { InvoiceDetailSheet } from "../../../finance/invoices/_components/invoice-detail-sheet";
import { InvoicesTable } from "../../../finance/invoices/_components/invoices-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function MemberInvoicesPage() {
	const params = useParams();
	const memberId = params.id as string;
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
		null,
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
		"all",
	);

	const memberQuery = useQuery(
		orpc.members.get.queryOptions({
			input: { memberId },
		}),
	);

	const handleSelectInvoice = (invoiceId: string) => {
		setSelectedInvoiceId(invoiceId);
		setSheetOpen(true);
	};

	const memberName = memberQuery.data
		? `${memberQuery.data.firstName} ${memberQuery.data.lastName}`.trim()
		: "Mitglied";

	return (
		<div className="flex flex-col gap-8">
			<Link href={`/dashboard/members/${memberId}`}>
				<Button variant="ghost" className="gap-2">
					<ArrowLeft className="size-4" />
					Zurück zum Mitglied
				</Button>
			</Link>

			<Header>
				<HeaderContent>
					<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-muted-foreground text-xs uppercase tracking-[0.24em]">
						<Receipt className="size-3.5" />
						Mitgliedsabrechnung
					</div>
					<HeaderTitle>Rechnungen</HeaderTitle>
					<HeaderDescription>
						{memberQuery.isPending ? (
							<Skeleton className="h-5 w-64" />
						) : (
							`${memberName}: alle Rechnungen im zeitlichen Verlauf mit Status und Betrag.`
						)}
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Select
						value={statusFilter}
						onValueChange={(value) =>
							setStatusFilter(value as InvoiceStatus | "all")
						}
					>
						<SelectTrigger className="w-[180px]">
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
				</HeaderActions>
			</Header>

			<InvoicesTable
				memberId={memberId}
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

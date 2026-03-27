"use client";

import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	ChevronDown,
	ChevronUp,
	ChevronsUpDown,
	FileText,
} from "lucide-react";
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
import { Frame, FramePanel } from "@/components/ui/frame";
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
	formatBillingPeriod,
	formatCents,
	getInvoiceStatusLabel,
	getInvoiceStatusVariant,
	type InvoiceStatus,
} from "@/utils/billing";
import { orpc } from "@/utils/orpc";

type SortField = "billingPeriodStart" | "totalCents" | "status";
type SortOrder = "asc" | "desc";

interface InvoicesTableProps {
	onSelectInvoice: (invoiceId: string) => void;
	statusFilter?: InvoiceStatus;
	memberId?: string;
}

export function InvoicesTable({
	onSelectInvoice,
	statusFilter,
	memberId,
}: InvoicesTableProps) {
	const [sortField, setSortField] = useState<SortField>("billingPeriodStart");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

	const { data, isPending, error, refetch } = useQuery(
		orpc.billing.listInvoices.queryOptions({
			input: {
				status: statusFilter,
				memberId,
			},
		}),
	);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortOrder("desc");
		}
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field) {
			return <ChevronsUpDown className="ml-1 size-3.5 opacity-50" />;
		}
		return sortOrder === "asc" ? (
			<ChevronUp className="ml-1 size-3.5" />
		) : (
			<ChevronDown className="ml-1 size-3.5" />
		);
	};

	// Sort data client-side
	const sortedData = data
		? [...data].sort((a, b) => {
				let comparison = 0;
				switch (sortField) {
					case "billingPeriodStart":
						comparison = a.billingPeriodStart.localeCompare(
							b.billingPeriodStart,
						);
						break;
					case "totalCents":
						comparison = a.totalCents - b.totalCents;
						break;
					case "status":
						comparison = a.status.localeCompare(b.status);
						break;
				}
				return sortOrder === "asc" ? comparison : -comparison;
			})
		: [];

	if (isPending) {
		return (
			<Frame>
				<FramePanel className="p-0">
					<div className="p-4">
						<Skeleton className="h-8 w-full" />
					</div>
					<div className="space-y-2 p-4 pt-0">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</div>
				</FramePanel>
			</Frame>
		);
	}

	if (error) {
		return (
			<Frame>
				<FramePanel>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<AlertCircle />
							</EmptyMedia>
							<EmptyTitle>Rechnungen konnten nicht geladen werden</EmptyTitle>
							<EmptyDescription>
								{error instanceof Error
									? error.message
									: "Ein Fehler ist aufgetreten."}
							</EmptyDescription>
						</EmptyHeader>
						<Button onClick={() => refetch()}>Erneut versuchen</Button>
					</Empty>
				</FramePanel>
			</Frame>
		);
	}

	if (!sortedData.length) {
		return (
			<Frame>
				<FramePanel>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<FileText />
							</EmptyMedia>
							<EmptyTitle>Keine Rechnungen</EmptyTitle>
							<EmptyDescription>
								{statusFilter
									? `Keine Rechnungen mit Status "${getInvoiceStatusLabel(statusFilter)}" gefunden.`
									: "Es wurden noch keine Rechnungen erstellt."}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</FramePanel>
			</Frame>
		);
	}

	return (
		<Frame>
			<FramePanel className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<button
									type="button"
									className="flex cursor-pointer items-center hover:text-foreground"
									onClick={() => handleSort("billingPeriodStart")}
								>
									Zeitraum
									<SortIcon field="billingPeriodStart" />
								</button>
							</TableHead>
							<TableHead>Mitglied</TableHead>
							<TableHead>
								<button
									type="button"
									className="flex cursor-pointer items-center hover:text-foreground"
									onClick={() => handleSort("status")}
								>
									Status
									<SortIcon field="status" />
								</button>
							</TableHead>
							<TableHead className="text-right">
								<button
									type="button"
									className="flex cursor-pointer items-center justify-end hover:text-foreground"
									onClick={() => handleSort("totalCents")}
								>
									Betrag
									<SortIcon field="totalCents" />
								</button>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedData.map((invoice) => (
							<TableRow
								key={invoice.id}
								className="cursor-pointer"
								onClick={() => onSelectInvoice(invoice.id)}
							>
								<TableCell className="font-medium">
									{formatBillingPeriod(
										invoice.billingPeriodStart,
										invoice.billingPeriodEnd,
									)}
								</TableCell>
								<TableCell>
									{invoice.memberFirstName} {invoice.memberLastName}
								</TableCell>
								<TableCell>
									<Badge
										variant={getInvoiceStatusVariant(
											invoice.status as InvoiceStatus,
										)}
									>
										{getInvoiceStatusLabel(invoice.status as InvoiceStatus)}
									</Badge>
								</TableCell>
								<TableCell className="text-right font-mono">
									{formatCents(invoice.totalCents, invoice.currency)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</FramePanel>
		</Frame>
	);
}

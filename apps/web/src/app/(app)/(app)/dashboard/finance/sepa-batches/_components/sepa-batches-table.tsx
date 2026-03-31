"use client";

import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	ChevronDown,
	ChevronUp,
	ChevronsUpDown,
	Download,
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
	formatBillingDateShort,
	formatCents,
	getSepaBatchStatusLabel,
	getSepaBatchStatusVariant,
	type SepaBatchStatus,
} from "@/utils/billing";
import { orpc } from "@/utils/orpc";

type SortField = "collectionDate" | "batchNumber" | "totalAmountCents" | "status";
type SortOrder = "asc" | "desc";

interface SepaBatchesTableProps {
	onSelectBatch: (batchId: string) => void;
	statusFilter?: SepaBatchStatus;
}

export function SepaBatchesTable({
	onSelectBatch,
	statusFilter,
}: SepaBatchesTableProps) {
	const [sortField, setSortField] = useState<SortField>("collectionDate");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

	const { data, isPending, error, refetch } = useQuery(
		orpc.billing.listSepaBatches.queryOptions({
			input: {},
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

	// Filter and sort data client-side
	const filteredData = statusFilter
		? data?.filter((batch) => batch.status === statusFilter)
		: data;

	const sortedData = filteredData
		? [...filteredData].sort((a, b) => {
				let comparison = 0;
				switch (sortField) {
					case "collectionDate":
						comparison = a.collectionDate.localeCompare(b.collectionDate);
						break;
					case "batchNumber":
						comparison = a.batchNumber.localeCompare(b.batchNumber);
						break;
					case "totalAmountCents":
						comparison = a.totalAmountCents - b.totalAmountCents;
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
							<EmptyTitle>SEPA-Batches konnten nicht geladen werden</EmptyTitle>
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
								<Download />
							</EmptyMedia>
							<EmptyTitle>Keine Lastschriften</EmptyTitle>
							<EmptyDescription>
								{statusFilter
									? `Keine Lastschriften mit Status "${getSepaBatchStatusLabel(statusFilter)}" gefunden.`
									: "Es wurden noch keine Lastschriften erzeugt."}
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
									onClick={() => handleSort("batchNumber")}
								>
									Batch-Nummer
									<SortIcon field="batchNumber" />
								</button>
							</TableHead>
							<TableHead>
								<button
									type="button"
									className="flex cursor-pointer items-center hover:text-foreground"
									onClick={() => handleSort("collectionDate")}
								>
									Einzugsdatum
									<SortIcon field="collectionDate" />
								</button>
							</TableHead>
							<TableHead>Transaktionen</TableHead>
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
									onClick={() => handleSort("totalAmountCents")}
								>
									Gesamtbetrag
									<SortIcon field="totalAmountCents" />
								</button>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedData.map((batch) => (
							<TableRow
								key={batch.id}
								className="cursor-pointer"
								onClick={() => onSelectBatch(batch.id)}
							>
								<TableCell className="font-mono text-sm">
									{batch.batchNumber}
								</TableCell>
								<TableCell>
									{formatBillingDateShort(batch.collectionDate)}
								</TableCell>
								<TableCell>{batch.transactionCount}</TableCell>
								<TableCell>
									<Badge
										variant={getSepaBatchStatusVariant(
											batch.status as SepaBatchStatus,
										)}
									>
										{getSepaBatchStatusLabel(batch.status as SepaBatchStatus)}
									</Badge>
								</TableCell>
								<TableCell className="text-right font-mono">
									{formatCents(batch.totalAmountCents)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</FramePanel>
		</Frame>
	);
}

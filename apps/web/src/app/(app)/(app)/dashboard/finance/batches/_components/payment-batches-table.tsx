"use client";
import type { InferClientOutputs } from "@orpc/client";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	Download,
	EyeIcon,
	Loader2,
	MoreVerticalIcon,
	SearchIcon,
	XIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { client } from "@/utils/orpc";
import { ViewBatchSheet } from "./view-batch-sheet";

type PaymentBatchesList = InferClientOutputs<
	typeof client
>["paymentBatches"]["list"];
type BatchRow = PaymentBatchesList[number];

const formatDate = (dateStr: string) => {
	const date = new Date(dateStr);
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
	}).format(date);
};

const formatCurrency = (amount: string | null) => {
	if (!amount) return "€0.00";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "EUR",
	}).format(Number.parseFloat(amount));
};

interface BatchActionsProps {
	batch: BatchRow;
	onViewBatch: (batchId: string) => void;
	onExportSepa?: (batchId: string) => void;
	exportingBatchId?: string | null;
}

function BatchActions({
	batch,
	onViewBatch,
	onExportSepa,
	exportingBatchId,
}: BatchActionsProps) {
	const isExporting = exportingBatchId === batch.id;
	return (
		<div className="flex items-center justify-end gap-2">
			<Button size="sm" variant="outline" onClick={() => onViewBatch(batch.id)}>
				<EyeIcon />
				View
			</Button>
			{onExportSepa ? (
				<Button
					size="sm"
					variant="outline"
					onClick={() => onExportSepa(batch.id)}
					disabled={isExporting}
				>
					{isExporting ? <Loader2 className="animate-spin" /> : <Download />}
					{isExporting ? "Preparing..." : "Download"}
				</Button>
			) : null}
			<Menu>
				<MenuTrigger
					render={
						<Button size="sm" variant="outline">
							<MoreVerticalIcon />
						</Button>
					}
				/>
				<MenuPopup align="end">
					<MenuItem onClick={() => onViewBatch(batch.id)}>
						<EyeIcon />
						View Details
					</MenuItem>
					<MenuItem
						disabled={!onExportSepa || isExporting}
						onClick={() => onExportSepa?.(batch.id)}
					>
						{isExporting ? <Loader2 className="animate-spin" /> : <Download />}
						{isExporting ? "Preparing..." : "Export SEPA"}
					</MenuItem>
				</MenuPopup>
			</Menu>
		</div>
	);
}

export const createColumns = (
	onViewBatch: (batchId: string) => void,
	onExportSepa?: (batchId: string) => void,
	exportingBatchId?: string | null,
): ColumnDef<BatchRow>[] => [
	{
		accessorKey: "billingMonth",
		header: "Billing Month",
		cell: ({ row }) => (
			<span className="font-medium">
				{formatDate(row.original.billingMonth)}
			</span>
		),
	},
	{
		accessorKey: "batchNumber",
		header: "Batch Number",
		cell: ({ row }) => (
			<Badge variant="outline">{row.original.batchNumber}</Badge>
		),
		enableSorting: false,
	},
	{
		accessorKey: "totalAmount",
		header: "Total Amount",
		cell: ({ row }) => (
			<span className="font-semibold">
				{formatCurrency(row.original.totalAmount)}
			</span>
		),
	},
	{
		accessorKey: "transactionCount",
		header: "Transactions",
	},
	{
		accessorKey: "createdAt",
		header: "Created",
		cell: ({ row }) => (
			<span className="text-muted-foreground text-sm">
				{new Date(row.original.createdAt).toLocaleDateString()}
			</span>
		),
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => {
			const batch = row.original;
			return (
				<BatchActions
					batch={batch}
					onViewBatch={onViewBatch}
					onExportSepa={onExportSepa}
					exportingBatchId={exportingBatchId}
				/>
			);
		},
	},
];

export default function PaymentBatchesTable({
	data,
	loading = false,
	onExportSepa,
	exportingBatchId,
}: {
	data: BatchRow[];
	loading?: boolean;
	onExportSepa?: (batchId: string) => void;
	exportingBatchId?: string | null;
}) {
	const pageSize = 10;

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: pageSize,
	});

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const [sorting, setSorting] = useState<SortingState>([
		{
			desc: true,
			id: "billingMonth",
		},
	]);

	const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleViewBatch = useCallback((batchId: string) => {
		setSelectedBatchId(batchId);
		setSheetOpen(true);
	}, []);

	const columns = useMemo(
		() => createColumns(handleViewBatch, onExportSepa, exportingBatchId),
		[handleViewBatch, onExportSepa, exportingBatchId],
	);

	const table = useReactTable({
		data: data || [],
		columns,
		enableSortingRemoval: false,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			pagination,
			sorting,
			columnFilters,
		},
	});

	// If there are no batches at all, show empty state
	if (!loading && !data?.length) {
		return (
			<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel className="py-12">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Download />
							</EmptyMedia>
							<EmptyTitle>No payment batches yet</EmptyTitle>
							<EmptyDescription>
								Get started by creating your first batch.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</FramePanel>
			</Frame>
		);
	}

	return (
		<>
			<ViewBatchSheet
				batchId={selectedBatchId}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
			<div className="">
				<div className="mb-4">
					<InputGroup className="max-w-sm">
						<InputGroupAddon>
							<SearchIcon className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							type="text"
							placeholder="Search batch number..."
							value={
								(table.getColumn("batchNumber")?.getFilterValue() as string) ??
								""
							}
							onChange={(event) =>
								table
									.getColumn("batchNumber")
									?.setFilterValue(event.target.value)
							}
						/>
						{((table.getColumn("batchNumber")?.getFilterValue() as string) ??
							"") !== "" && (
							<InputGroupAddon
								align={"inline-end"}
								className="cursor-pointer"
								onClick={() =>
									table.getColumn("batchNumber")?.setFilterValue("")
								}
							>
								<XIcon className="size-4" />
							</InputGroupAddon>
						)}
					</InputGroup>
				</div>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow className="hover:bg-transparent" key={headerGroup.id}>
								{headerGroup.headers.map((header, idx) => {
									const isLast = idx === headerGroup.headers.length - 1;
									return (
										<TableHead
											key={header.id}
											className={isLast ? "text-right" : undefined}
										>
											{header.isPlaceholder ? null : header.column.getCanSort() ? (
												<div
													className="flex h-full cursor-pointer select-none items-center justify-between gap-2"
													onClick={header.column.getToggleSortingHandler()}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault();
															header.column.getToggleSortingHandler()?.(e);
														}
													}}
													role="button"
													tabIndex={0}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{{
														asc: (
															<ChevronUpIcon
																aria-hidden="true"
																className="size-4 shrink-0 opacity-80"
															/>
														),
														desc: (
															<ChevronDownIcon
																aria-hidden="true"
																className="size-4 shrink-0 opacity-80"
															/>
														),
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											) : (
												flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: table.getState().pagination.pageSize }).map(
								(_, idx) => (
									<TableRow key={`skeleton-${idx}`}>
										{columns.map((_column, colIdx) => (
											<TableCell key={`skeleton-${idx}-${colIdx}`}>
												<Skeleton className="h-5 w-full" />
											</TableCell>
										))}
									</TableRow>
								),
							)
						) : !table.getRowModel().rows?.length ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results found.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() ? "selected" : undefined}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
					<TableFooter>
						<TableRow>
							<TableCell colSpan={columns.length} className="p-2">
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2 whitespace-nowrap">
										<p className="text-muted-foreground text-sm">Showing</p>
										<Select
											items={[
												{ label: "10", value: 10 },
												{ label: "20", value: 20 },
												{ label: "30", value: 30 },
												{ label: "50", value: 50 },
											]}
											onValueChange={(value) => {
												table.setPageSize(value as number);
											}}
											value={table.getState().pagination.pageSize}
										>
											<SelectTrigger
												aria-label="Rows per page"
												className="w-fit min-w-none"
												size="sm"
											>
												<SelectValue />
											</SelectTrigger>
											<SelectPopup>
												<SelectItem value={10}>10</SelectItem>
												<SelectItem value={20}>20</SelectItem>
												<SelectItem value={30}>30</SelectItem>
												<SelectItem value={50}>50</SelectItem>
											</SelectPopup>
										</Select>
										<span className="text-muted-foreground text-sm">
											of{" "}
											<strong className="font-medium text-foreground">
												{table.getRowCount()}
											</strong>
										</span>
									</div>
									<Pagination className="justify-end">
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													className="sm:*:[svg]:hidden"
													render={
														<Button
															disabled={!table.getCanPreviousPage()}
															onClick={() => table.previousPage()}
															size="sm"
															variant="outline"
														>
															Previous
														</Button>
													}
												/>
											</PaginationItem>
											<PaginationItem>
												<PaginationNext
													className="sm:*:[svg]:hidden"
													render={
														<Button
															disabled={!table.getCanNextPage()}
															onClick={() => table.nextPage()}
															size="sm"
															variant="outline"
														>
															Next
														</Button>
													}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</div>
		</>
	);
}

"use client";
import type { InferClientOutputs } from "@orpc/client";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	EditIcon,
	EyeIcon,
	MoreVerticalIcon,
	SearchIcon,
	UserIcon,
	UserXIcon,
	XIcon,
} from "lucide-react";
import { type CSSProperties, useMemo, useRef, useState } from "react";
import { CopyableTableCell } from "@/components/table/copyable-table-cell";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Menu,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuTrigger,
} from "@/components/ui/menu";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import type { client } from "@/utils/orpc";
import { CancelMemberDialog } from "./cancel-member-dialog";
import { MemberOverviewSheet } from "./member-overview-sheet";

type MembersListResponse = InferClientOutputs<typeof client>["members"]["list"];
type MemberRow = MembersListResponse["data"][number];
type GroupsListResponse = InferClientOutputs<typeof client>["groups"]["list"];
type Group = GroupsListResponse[number];
type MemberStatusFilter = "active" | "cancelled" | "cancelled_but_active";

interface MembersTableProps {
	data: MemberRow[];
	pagination: {
		page: number;
		limit: number;
		totalCount: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
	search: string;
	groupIds: string[];
	groups: Group[];
	memberStatus: MemberStatusFilter;
	onSearchChange: (search: string) => void;
	onPageChange: (page: number) => void;
	onLimitChange: (limit: number) => void;
	onGroupFilterChange: (groupIds: string[]) => void;
	onStatusFilterChange: (status: MemberStatusFilter) => void;
	loading?: boolean;
}

function getGroupBadgeStyle(color: unknown): CSSProperties | undefined {
	if (typeof color !== "string" || color.trim().length === 0) {
		return undefined;
	}

	return {
		color,
		borderColor: color,
		backgroundColor: `${color}1A`,
	};
}

const createColumns = (
	onViewMember: (member: MemberRow) => void,
	onCancelMember: (member: MemberRow) => void,
): ColumnDef<MemberRow>[] => [
	{
		accessorKey: "firstName",
		header: "Vorname",
		cell: ({ row }) => {
			const isCancelled = row.original.contract?.cancelledAt !== null;
			const cancellationEffectiveDate =
				row.original.contract?.cancellationEffectiveDate;
			const effectiveDate = cancellationEffectiveDate
				? new Date(cancellationEffectiveDate)
				: null;
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			if (effectiveDate) {
				effectiveDate.setHours(0, 0, 0, 0);
			}
			const isCancellationEffective =
				isCancelled && effectiveDate ? effectiveDate < today : false;

			if (!isCancelled) {
				return <span>{row.original.firstName}</span>;
			}

			return (
				<div className="flex items-center gap-2">
					<span>{row.original.firstName}</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger
								render={
									<Badge
										variant={isCancellationEffective ? "secondary" : "outline"}
									/>
								}
							>
								<span
									aria-hidden="true"
									className={
										isCancellationEffective
											? "size-1.5 rounded-full bg-amber-500"
											: "size-1.5 rounded-full bg-red-500"
									}
								/>
								{isCancellationEffective ? "Ended" : "Gekündigt"}
							</TooltipTrigger>
							<TooltipContent>
								<p className="text-sm">
									{isCancellationEffective
										? "Mitgliedschaft endete am "
										: "Mitgliedschaft endet am "}
									{cancellationEffectiveDate
										? new Date(cancellationEffectiveDate).toLocaleDateString()
										: "N/A"}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			);
		},
	},
	{
		accessorKey: "lastName",
		header: "Nachname",
	},
	{
		accessorKey: "email",
		header: "E-Mail",
		cell: ({ row }) => {
			return <CopyableTableCell value={row.original.email} />;
		},
	},
	{
		accessorKey: "phone",
		header: "Phone",
		cell: ({ row }) => {
			return <CopyableTableCell value={row.original.phone} />;
		},
	},
	{
		accessorKey: "groups",
		header: "Gruppen",
		cell: ({ row }) => {
			const memberRow = row.original;
			const groupMembers: NonNullable<typeof memberRow.groupMembers> =
				memberRow.groupMembers ?? [];
			if (groupMembers.length === 0) {
				return <span className="text-muted-foreground text-sm">—</span>;
			}
			return (
				<div className="flex flex-wrap gap-1">
					{groupMembers.map((gm: (typeof groupMembers)[number]) => {
						const groupColor =
							"color" in gm.group
								? (gm.group as { color?: unknown }).color
								: undefined;
						return (
							<Badge
								variant="outline"
								key={gm.groupId}
								style={getGroupBadgeStyle(groupColor)}
							>
								{gm.group.name}
							</Badge>
						);
					})}
				</div>
			);
		},
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => {
			const member = row.original;
			const isCancelled = member.contract?.cancelledAt !== null;

			return (
				<div className="flex items-center justify-end gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => onViewMember(member)}
					>
						<EyeIcon />
						View
					</Button>
					<Menu>
						<MenuTrigger
							render={
								<Button size="sm" variant="outline">
									<MoreVerticalIcon />
								</Button>
							}
						/>
						<MenuPopup align="end">
							<MenuItem onClick={() => console.log("Edit member:", member)}>
								<EditIcon />
								Edit
							</MenuItem>
							<MenuSeparator />
							<MenuItem
								variant="destructive"
								disabled={isCancelled}
								onClick={() => onCancelMember(member)}
							>
								<UserXIcon />
								{isCancelled ? "Bereits gekündigt" : "Mitgliedschaft kündigen"}
							</MenuItem>
						</MenuPopup>
					</Menu>
				</div>
			);
		},
	},
];

export default function MembersTable({
	data,
	pagination,
	search,
	groupIds,
	groups,
	memberStatus,
	onSearchChange,
	onPageChange,
	onLimitChange,
	onGroupFilterChange,
	onStatusFilterChange,
	loading = false,
}: MembersTableProps) {
	"use no memo";
	const [sorting, setSorting] = useState<SortingState>([]);
	const [localSearch, setLocalSearch] = useState(search);
	const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [cancelMember, setCancelMember] = useState<MemberRow | null>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

	// Debounce the search change handler
	const debouncedOnSearchChange = useDebounce(onSearchChange, 300);

	// Handle member view
	const handleViewMember = (member: MemberRow) => {
		setSelectedMember(member);
		setSheetOpen(true);
	};

	const handleCancelMember = (member: MemberRow) => {
		setCancelMember(member);
		setCancelDialogOpen(true);
	};

	const columns = createColumns(handleViewMember, handleCancelMember);
	const skeletonRowKeys = useMemo(
		() =>
			Array.from(
				{ length: pagination.limit },
				() =>
					globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
			),
		[pagination.limit],
	);
	const skeletonColumnKeys = useMemo(
		() =>
			columns.map(
				(column) =>
					column.id ??
					(typeof column.header === "string"
						? column.header
						: (globalThis.crypto?.randomUUID?.() ??
							`${Date.now()}-${Math.random()}`)),
			),
		[columns],
	);

	const prevSearchRef = useRef(search);
	if (prevSearchRef.current !== search) {
		prevSearchRef.current = search;
		setLocalSearch(search);
	}

	const table = useReactTable({
		data: data || [],
		columns,
		pageCount: pagination.totalPages,
		state: {
			sorting,
		},
		enableSortingRemoval: false,
		manualPagination: true,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
	});

	const hasNoMembers =
		!loading &&
		!data?.length &&
		!search &&
		groupIds.length === 0 &&
		memberStatus === "active" &&
		pagination.totalCount === 0;

	if (hasNoMembers) {
		return (
			<div className="py-12">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<UserIcon />
						</EmptyMedia>
						<EmptyTitle>Noch keine Mitglieder</EmptyTitle>
						<EmptyDescription>
							Lege los, indem du dein erstes Mitglied erstellst.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	const hasActiveFilters =
		Boolean(search) || groupIds.length > 0 || memberStatus !== "active";

	return (
		<div className="">
			<div className="mb-4 flex items-center justify-between gap-2">
				<div className="flex gap-2">
					<InputGroup className="max-w-md">
						<InputGroupAddon>
							<SearchIcon className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							type="text"
							placeholder="Nach Name oder E-Mail suchen..."
							value={localSearch}
							onChange={(event) => {
								const newValue = event.target.value;
								setLocalSearch(newValue);
								debouncedOnSearchChange(newValue);
							}}
						/>
						{localSearch !== "" && (
							<InputGroupAddon
								align="inline-end"
								className="cursor-pointer"
								onClick={() => {
									setLocalSearch("");
									onSearchChange("");
								}}
							>
								<XIcon className="size-4" />
							</InputGroupAddon>
						)}
					</InputGroup>

					{/* Group Filter */}
					<DataTableFacetedFilter
						title="Gruppen"
						options={groups.map((g) => ({ label: g.name, value: g.id }))}
						selectedValues={groupIds}
						onValueChange={onGroupFilterChange}
					/>
				</div>

				<div className="flex items-center gap-2">
					<Select
						items={[
							{ label: "Active", value: "active" },
							{ label: "Cancelled", value: "cancelled" },
							{
								label: "Cancelled But Still Active",
								value: "cancelled_but_active",
							},
						]}
						value={memberStatus}
						onValueChange={(value) =>
							onStatusFilterChange(value as MemberStatusFilter)
						}
					>
						<SelectTrigger className="w-[240px]" size="sm">
							<SelectValue />
						</SelectTrigger>
						<SelectPopup>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="cancelled">Cancelled</SelectItem>
							<SelectItem value="cancelled_but_active">
								Cancelled But Still Active
							</SelectItem>
						</SelectPopup>
					</Select>

					{hasActiveFilters && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setLocalSearch("");
								onSearchChange("");
								onGroupFilterChange([]);
								onStatusFilterChange("active");
							}}
						>
							Reset filters
						</Button>
					)}
				</div>
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
											<button
												className="flex h-full w-full cursor-pointer select-none items-center justify-between gap-2"
												onClick={header.column.getToggleSortingHandler()}
												type="button"
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
											</button>
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
						skeletonRowKeys.map((rowKey) => (
							<TableRow key={rowKey}>
								{skeletonColumnKeys.map((columnKey) => (
									<TableCell key={`${rowKey}-${columnKey}`} className="py-3">
										<Skeleton className="h-5 w-full" />
									</TableCell>
								))}
							</TableRow>
						))
					) : !table.getRowModel().rows?.length ? (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-32 text-center">
								<div className="flex flex-col items-center justify-center gap-2">
									<p className="text-muted-foreground">
										{search || groupIds.length > 0 || memberStatus !== "active"
											? "Keine Mitglieder gefunden, die den Filtern entsprechen."
											: "No results found."}
									</p>
									{hasActiveFilters && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setLocalSearch("");
												onSearchChange("");
												onGroupFilterChange([]);
												onStatusFilterChange("active");
											}}
										>
											Reset filters
										</Button>
									)}
								</div>
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
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
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
											onLimitChange(value as number);
										}}
										value={pagination.limit}
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
											{pagination.totalCount}
										</strong>{" "}
										{pagination.totalCount === 1 ? "member" : "members"}
									</span>
								</div>
								<Pagination className="justify-end">
									<PaginationContent>
										<PaginationItem>
											<span className="text-muted-foreground text-sm">
												Page {pagination.page} of {pagination.totalPages}
											</span>
										</PaginationItem>
										<PaginationItem>
											<PaginationPrevious
												className="sm:*:[svg]:hidden"
												render={
													<Button
														disabled={!pagination.hasPreviousPage}
														onClick={() => onPageChange(pagination.page - 1)}
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
														disabled={!pagination.hasNextPage}
														onClick={() => onPageChange(pagination.page + 1)}
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

			<MemberOverviewSheet
				member={selectedMember}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>

			{cancelMember && (
				<CancelMemberDialog
					memberId={cancelMember.id}
					memberName={`${cancelMember.firstName} ${cancelMember.lastName}`.trim()}
					initialPeriodEndDate={cancelMember.contract?.initialPeriodEndDate}
					open={cancelDialogOpen}
					onOpenChange={(nextOpen) => {
						setCancelDialogOpen(nextOpen);
						if (!nextOpen) {
							setCancelMember(null);
						}
					}}
				/>
			)}
		</div>
	);
}

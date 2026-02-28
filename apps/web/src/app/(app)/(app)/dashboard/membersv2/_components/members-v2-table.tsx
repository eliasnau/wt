"use client";

import type { InferClientOutputs } from "@orpc/client";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	EditIcon,
	EyeIcon,
	MoreVerticalIcon,
	UserIcon,
	UserXIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CopyableTableCell } from "@/components/table/copyable-table-cell";
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
import type { client } from "@/utils/orpc";
import { CancelMemberDialog } from "../../members/_components/cancel-member-dialog";
import { MemberOverviewSheet } from "../../members/_components/member-overview-sheet";

type MembersQueryResponse = InferClientOutputs<
	typeof client
>["members"]["query"];
type MemberRow = MembersQueryResponse["data"][number];

interface MembersV2TableProps {
	data: MemberRow[];
	pagination: {
		page: number;
		limit: number;
		totalCount: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
	hasActiveFilters: boolean;
	onClearFilters: () => void;
	onPageChange: (page: number) => void;
	onLimitChange: (limit: number) => void;
	loading?: boolean;
}

const createColumns = (
	onViewMember: (member: MemberRow) => void,
	onCancelMember: (member: MemberRow) => void,
): ColumnDef<MemberRow>[] => [
	{
		accessorKey: "firstName",
		header: "Vorname",
		cell: ({ row }) => {
			const member = row.original;
			const status = member.membershipStatus;
			const effectiveDate = member.contract?.cancellationEffectiveDate;

			if (status === "active") {
				return <span>{member.firstName}</span>;
			}

			const variant = status === "cancelled" ? "secondary" : "outline";
			const dotClass = status === "cancelled" ? "bg-amber-500" : "bg-red-500";
			const label = status === "cancelled" ? "Beendet" : "Gekündigt (aktiv)";

			return (
				<div className="flex items-center gap-2">
					<span>{member.firstName}</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger render={<Badge variant={variant} />}>
								<span
									aria-hidden="true"
									className={`size-1.5 rounded-full ${dotClass}`}
								/>
								{label}
							</TooltipTrigger>
							<TooltipContent>
								<p className="text-sm">
									{effectiveDate
										? `Wirksam am ${new Date(effectiveDate).toLocaleDateString()}`
										: "Kein Enddatum gesetzt"}
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
		cell: ({ row }) => <CopyableTableCell value={row.original.email} />,
	},
	{
		accessorKey: "phone",
		header: "Telefon",
		cell: ({ row }) => <CopyableTableCell value={row.original.phone} />,
	},
	{
		accessorKey: "groups",
		header: "Gruppen",
		cell: ({ row }) => {
			const groupMembers = row.original.groupMembers ?? [];
			if (groupMembers.length === 0) {
				return <span className="text-muted-foreground text-sm">—</span>;
			}

			return (
				<div className="flex flex-wrap gap-1">
					{groupMembers.map((groupMember) => (
						<Badge variant="outline" key={groupMember.groupId}>
							{groupMember.group.name}
						</Badge>
					))}
				</div>
			);
		},
	},
	{
		id: "actions",
		header: "Aktionen",
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
						Details
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
								Bearbeiten
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

export function MembersV2Table({
	data,
	pagination,
	hasActiveFilters,
	onClearFilters,
	onPageChange,
	onLimitChange,
	loading = false,
}: MembersV2TableProps) {
	const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [cancelMember, setCancelMember] = useState<MemberRow | null>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

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

	const table = useReactTable({
		data,
		columns,
		manualPagination: true,
		pageCount: pagination.totalPages,
		getCoreRowModel: getCoreRowModel(),
	});

	const hasNoMembers =
		!loading &&
		!data.length &&
		!hasActiveFilters &&
		pagination.totalCount === 0;

	if (hasNoMembers) {
		return (
			<div className="rounded-xl border bg-background py-12">
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

	return (
		<>
			<div className="overflow-hidden rounded-xl border bg-background">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow className="hover:bg-transparent" key={headerGroup.id}>
								{headerGroup.headers.map((header, index) => {
									const isLast = index === headerGroup.headers.length - 1;
									return (
										<TableHead
											key={header.id}
											className={isLast ? "text-right" : undefined}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
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
						) : !table.getRowModel().rows.length ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-32 text-center"
								>
									<div className="flex flex-col items-center justify-center gap-2">
										<p className="text-muted-foreground">
											Keine Mitglieder entsprechen den aktuellen Filtern.
										</p>
										{hasActiveFilters && (
											<Button
												size="sm"
												variant="outline"
												onClick={onClearFilters}
											>
												Filter zurücksetzen
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
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
			</div>

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
		</>
	);
}

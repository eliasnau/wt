"use client";

import type { InferClientOutputs } from "@orpc/client";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type OnChangeFn,
	type RowSelectionState,
	useReactTable,
} from "@tanstack/react-table";
import {
	FilterIcon,
	BotIcon,
	DownloadIcon,
	EditIcon,
	EyeIcon,
	ExternalLinkIcon,
	MailIcon,
	MoreVerticalIcon,
	PhoneIcon,
	UserIcon,
	UserXIcon,
	XIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type React from "react";
import { type CSSProperties, useMemo, useState } from "react";
import { CopyableTableCell } from "@/components/table/copyable-table-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Menu,
	MenuGroup,
	MenuGroupLabel,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuTrigger,
	MenuShortcut,
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
	Toolbar,
	ToolbarButton,
	ToolbarGroup,
	ToolbarSeparator,
} from "@/components/ui/toolbar";
import {
	TableCell,
	TableHead,
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
	canExportCsv: boolean;
	data: MemberRow[];
	rowSelection: RowSelectionState;
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
	onClearSelection: () => void;
	onExportCsv: () => void;
	onShowOnlySelected: () => void;
	onRowSelectionChange: OnChangeFn<RowSelectionState>;
	onPageChange: (page: number) => void;
	onLimitChange: (limit: number) => void;
	exportPending?: boolean;
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
		id: "select",
		enableSorting: false,
		size: 40,
		header: ({ table }) => {
			const isAllSelected = table.getIsAllPageRowsSelected();
			const isSomeSelected = table.getIsSomePageRowsSelected();
			const toggleHandler = table.getToggleAllPageRowsSelectedHandler();
			return (
				<Checkbox
					aria-label="Alle Mitglieder auswählen"
					checked={isAllSelected}
					indeterminate={isSomeSelected && !isAllSelected}
					onCheckedChange={(value) => {
						const syntheticEvent = {
							target: { checked: Boolean(value) },
						} as React.ChangeEvent<HTMLInputElement>;
						toggleHandler(syntheticEvent);
					}}
				/>
			);
		},
		cell: ({ row }) => {
			const toggleHandler = row.getToggleSelectedHandler();
			return (
				<Checkbox
					aria-label={`Mitglied ${row.original.firstName} ${row.original.lastName} auswählen`}
					checked={row.getIsSelected()}
					disabled={!row.getCanSelect()}
					onCheckedChange={(value) => {
						const syntheticEvent = {
							target: { checked: Boolean(value) },
						} as React.ChangeEvent<HTMLInputElement>;
						toggleHandler(syntheticEvent);
					}}
				/>
			);
		},
	},
	{
		accessorKey: "firstName",
		header: "Vorname",
		cell: ({ row }) => {
			const member = row.original;
			const status = member.membershipStatus;
			const effectiveDate = member.contract?.cancellationEffectiveDate;
			const memberHref = `/dashboard/members/${member.id}` as Route;

			if (status === "active") {
				return (
					<Link
						href={memberHref}
						className="font-medium hover:underline focus-visible:underline"
					>
						{member.firstName}
					</Link>
				);
			}

			const variant = status === "cancelled" ? "secondary" : "outline";
			const dotClass = status === "cancelled" ? "bg-amber-500" : "bg-red-500";
			const label = status === "cancelled" ? "Beendet" : "Gekündigt (aktiv)";

				return (
					<div className="flex items-center gap-2">
						<Link
							href={memberHref}
							className="font-medium hover:underline focus-visible:underline"
						>
							{member.firstName}
						</Link>
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
			cell: ({ row }) => (
				<div className="max-w-[260px]">
					<CopyableTableCell value={row.original.email} />
				</div>
			),
		},
		{
			accessorKey: "phone",
			header: "Telefon",
			cell: ({ row }) => (
				<div className="max-w-[180px]">
					<CopyableTableCell value={row.original.phone} />
				</div>
			),
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
						<Badge
							variant="outline"
							key={groupMember.groupId}
							style={getGroupBadgeStyle(groupMember.group.color)}
						>
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
				const memberHref = `/dashboard/members/${member.id}` as Route;
				const hasEmail =
					typeof member.email === "string" && member.email.trim().length > 0;
				const hasPhone =
					typeof member.phone === "string" && member.phone.trim().length > 0;

				return (
					<div className="flex items-center justify-end gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => onViewMember(member)}
						>
							<EyeIcon />
							Info
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
									<MenuItem
										onClick={() =>
											window.open(memberHref, "_blank", "noopener,noreferrer")
										}
									>
										<ExternalLinkIcon />
										Open in new tab
									</MenuItem>
									<MenuItem
										onClick={() => {
											window.location.href = memberHref;
										}}
									>
										<EditIcon />
										Bearbeiten
									</MenuItem>
									<MenuSeparator />
									<MenuItem
										disabled={!hasEmail}
										onClick={() => {
											if (!hasEmail) return;
										window.location.href = `mailto:${member.email}`;
									}}
								>
									<MailIcon />
									E-Mail senden
								</MenuItem>
								<MenuItem
									disabled={!hasPhone}
									onClick={() => {
										if (!hasPhone) return;
										window.location.href = `tel:${member.phone}`;
									}}
								>
										<PhoneIcon />
										Anrufen
									</MenuItem>
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
	canExportCsv,
	data,
	rowSelection,
	pagination,
	hasActiveFilters,
	onClearFilters,
	onClearSelection,
	onExportCsv,
	onShowOnlySelected,
	onRowSelectionChange,
	onPageChange,
	onLimitChange,
	exportPending = false,
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

	const columns = useMemo(
		() => createColumns(handleViewMember, handleCancelMember),
		[],
	);

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
		enableRowSelection: true,
		getRowId: (row) => row.id,
		manualPagination: true,
		pageCount: pagination.totalPages,
		getCoreRowModel: getCoreRowModel(),
		onRowSelectionChange,
		state: {
			rowSelection,
		},
	});

	const selectedCount = Object.values(rowSelection).filter(Boolean).length;

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
			<div className="min-w-0 max-w-full rounded-xl border bg-background">
				<div className="relative min-w-0 max-w-full overflow-x-auto">
					<table className="w-full min-w-[1040px] caption-bottom text-sm">
						<thead className="[&_tr]:border-b">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header, index) => {
										const isLast = index === headerGroup.headers.length - 1;
										return (
											<TableHead
												key={header.id}
												className={`${header.column.id === "select" ? "w-px" : ""} ${isLast ? "text-right" : ""}`}
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
								</tr>
							))}
						</thead>
						<tbody className="[&_tr:last-child]:border-0">
							{loading ? (
								skeletonRowKeys.map((rowKey) => (
									<tr key={rowKey} className="border-b">
										{skeletonColumnKeys.map((columnKey) => (
											<TableCell key={`${rowKey}-${columnKey}`} className="py-3">
												<Skeleton className="h-5 w-full" />
											</TableCell>
										))}
									</tr>
								))
							) : !table.getRowModel().rows.length ? (
								<tr className="border-b">
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
								</tr>
							) : (
								table.getRowModel().rows.map((row) => (
									<tr
										key={row.id}
										className={
											row.getIsSelected()
												? "border-b bg-primary/4 transition-colors hover:bg-primary/6"
												: "border-b transition-colors hover:bg-muted/50"
										}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={cell.column.id === "select" ? "w-px" : ""}
											>
												{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
												)}
											</TableCell>
										))}
									</tr>
								))
							)}
						</tbody>
						<tfoot className="border-t bg-muted/50 font-medium [&>tr]:last:border-b-0">
							<tr>
								<TableCell colSpan={columns.length} className="p-2">
									<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2 whitespace-nowrap">
										<p className="text-muted-foreground text-sm">Zeige</p>
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
											von{" "}
											<strong className="font-medium text-foreground">
												{pagination.totalCount}
											</strong>{" "}
											{pagination.totalCount === 1 ? "Mitglied" : "Mitgliedern"}
										</span>
									</div>
									<Pagination className="justify-end">
										<PaginationContent>
											<PaginationItem>
												<span className="text-muted-foreground text-sm">
													Seite {pagination.page} von {pagination.totalPages}
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
															Zurück
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
															Weiter
														</Button>
													}
												/>
											</PaginationItem>
										</PaginationContent>
										</Pagination>
									</div>
								</TableCell>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>

			<div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
				<Toolbar
					aria-label="Aktionen für ausgewählte Mitglieder"
					className={
						selectedCount > 0
							? "pointer-events-auto translate-y-0 opacity-100 transition-all duration-200 ease-out"
							: "pointer-events-none translate-y-4 opacity-0 transition-all duration-200 ease-out"
					}
				>
					<ToolbarGroup>
						<p className="px-1.5 font-medium text-sm leading-none sm:px-2">
							<span className="sm:hidden">{selectedCount}</span>
							<span className="hidden sm:inline">{selectedCount} ausgewählt</span>
						</p>
					</ToolbarGroup>
					<ToolbarSeparator />
					<ToolbarGroup>
						<ToolbarButton
							render={
								<Button
									disabled={!canExportCsv || exportPending}
									size="sm"
									variant="outline"
									onClick={onExportCsv}
								/>
							}
						>
							<DownloadIcon />
							<span className="hidden sm:inline">Export CSV</span>
						</ToolbarButton>
						<ToolbarButton
							render={
								<Button
									disabled
									size="sm"
									variant="outline"
								/>
							}
						>
							<MailIcon />
							<span className="hidden sm:inline">E-Mail</span>
							<Badge className="hidden sm:inline-flex" variant="outline">
								Demnächst
							</Badge>
						</ToolbarButton>
						<ToolbarButton
							render={
								<Button
									disabled
									size="sm"
									variant="outline"
								/>
							}
						>
							<BotIcon />
							<span className="hidden sm:inline">KI fragen</span>
							<Badge className="hidden sm:inline-flex" variant="outline">
								Demnächst
							</Badge>
						</ToolbarButton>
						<Menu>
							<MenuTrigger
								render={
									<Button aria-label="Weitere Aktionen" size="sm" variant="outline">
										<MoreVerticalIcon />
									</Button>
								}
							/>
							<MenuPopup align="end" className="w-[240px]">
								<MenuGroup>
									<MenuGroupLabel>Ausgewählte Mitglieder</MenuGroupLabel>
									<MenuItem onClick={onShowOnlySelected}>
										<FilterIcon />
										Nur Auswahl anzeigen
										<MenuShortcut>{selectedCount}</MenuShortcut>
									</MenuItem>
								</MenuGroup>
								<MenuSeparator />
								<MenuItem disabled>
									<EditIcon />
									Sammelbearbeitung
									<MenuShortcut>Demnächst</MenuShortcut>
								</MenuItem>
							</MenuPopup>
						</Menu>
					</ToolbarGroup>
					<ToolbarSeparator />
					<ToolbarGroup>
						<ToolbarButton
							render={
								<Button
									size="sm"
									variant="ghost"
									onClick={onClearSelection}
								/>
							}
						>
							<XIcon />
							<span className="hidden sm:inline">Abwählen</span>
						</ToolbarButton>
					</ToolbarGroup>
				</Toolbar>
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

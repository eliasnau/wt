"use client";
import type { InferClientOutputs } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
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
	EditIcon,
	MoreVerticalIcon,
	SearchIcon,
	TrashIcon,
	UserIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CardFrame } from "@/components/ui/card";
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
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/utils/billing";
import { client } from "@/utils/orpc";
import { EditGroupSheet } from "./group-sheets";

type GroupsList = InferClientOutputs<typeof client>["groups"]["list"];
type GroupRow = GroupsList[number];

function DeleteGroupDialog({
	group,
	open,
	onOpenChange,
	onSuccess,
}: {
	group: GroupRow | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const deleteGroupMutation = useMutation({
		mutationFn: async (id: string) => {
			return client.groups.delete({ id });
		},
		onSuccess: () => {
			toast.success("Gruppe erfolgreich gelöscht");
			onOpenChange(false);
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(error.message ?? "Gruppe konnte nicht gelöscht werden");
		},
	});

	const handleDelete = () => {
		if (group) {
			deleteGroupMutation.mutate(group.id);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogPopup>
				<AlertDialogHeader>
					<AlertDialogTitle>Gruppe löschen</AlertDialogTitle>
					<AlertDialogDescription>
						Möchtest du "{group?.name}" wirklich löschen? Diese Aktion kann
						nicht rückgängig gemacht werden.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose
						render={<Button variant="outline" />}
						disabled={deleteGroupMutation.isPending}
					>
						Abbrechen
					</AlertDialogClose>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteGroupMutation.isPending}
					>
						{deleteGroupMutation.isPending ? (
							<>
								<Spinner />
								Wird gelöscht...
							</>
						) : (
							"Löschen"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogPopup>
		</AlertDialog>
	);
}

export const columns: ColumnDef<GroupRow>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => {
			const color = row.original.color ?? "#000000";
			return (
				<div className="flex items-center gap-2">
					<span
						className="size-3 shrink-0 rounded-full border"
						style={{ backgroundColor: color }}
					/>
					{row.original.name}
				</div>
			);
		},
	},
	{
		accessorKey: "description",
		header: "Beschreibung",
		enableSorting: false,
	},
	{
		accessorKey: "defaultMembershipPriceCents",
		header: "Mitgliedsbeitrag",
		meta: { className: "text-right" },
		cell: ({ row }) => (
			<div className="text-right">
				{formatCents(row.original.defaultMembershipPriceCents ?? 0)}
			</div>
		),
	},
	{
		id: "actions",
		header: "",
		enableSorting: false,
		meta: { className: "w-0" },
		cell: ({ row, table }) => {
			const group = row.original;
			const { onDeleteGroup, onEditGroup } = table.options.meta as {
				onDeleteGroup: (group: GroupRow) => void;
				onEditGroup: (group: GroupRow) => void;
			};

			return (
				<div className="flex items-center justify-end gap-2">
					<Button
						size="sm"
						variant="outline"
						render={
							<Link
								href={`/dashboard/members?groupIds=${encodeURIComponent(group.id)}`}
							/>
						}
					>
						<UserIcon />
						Mitglieder
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
							<MenuItem onClick={() => onEditGroup(group)}>
								<EditIcon />
								Bearbeiten
							</MenuItem>
							<MenuSeparator />
							<MenuItem
								variant="destructive"
								onClick={() => onDeleteGroup(group)}
							>
								<TrashIcon />
								Gruppe löschen
							</MenuItem>
						</MenuPopup>
					</Menu>
				</div>
			);
		},
	},
];

export default function GroupTable({
	data,
	loading = false,
	onRefetch,
}: {
	data: GroupRow[];
	loading?: boolean;
	onRefetch?: () => void;
}) {
	"use no memo";
	const pageSize = 10;

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: pageSize,
	});

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const [sorting, setSorting] = useState<SortingState>([
		{
			desc: false,
			id: "name",
		},
	]);

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [groupToDelete, setGroupToDelete] = useState<GroupRow | null>(null);
	const [editGroupOpen, setEditGroupOpen] = useState(false);
	const [activeGroup, setActiveGroup] = useState<GroupRow | null>(null);

	const handleDeleteGroup = (group: GroupRow) => {
		setGroupToDelete(group);
		setDeleteDialogOpen(true);
	};

	const handleEditGroup = (group: GroupRow) => {
		setActiveGroup(group);
		setEditGroupOpen(true);
	};

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
		meta: {
			onDeleteGroup: handleDeleteGroup,
			onEditGroup: handleEditGroup,
		},
		state: {
			pagination,
			sorting,
			columnFilters,
		},
	});
	const skeletonRowKeys = Array.from(
		{ length: table.getState().pagination.pageSize },
		(_, index) =>
			`skeleton-row-${table.getState().pagination.pageSize}-${index}`,
	);
	const skeletonColumnKeys = columns.map((column, index) => {
		if ("id" in column && typeof column.id === "string") {
			return column.id;
		}

		if (
			"accessorKey" in column &&
			typeof column.accessorKey === "string" &&
			column.accessorKey.length > 0
		) {
			return column.accessorKey;
		}

		return `column-${index}`;
	});

	// If there are no groups at all, show empty state
	if (!loading && !data?.length) {
		return (
			<Frame>
				<FramePanel>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<UserIcon />
							</EmptyMedia>
							<EmptyTitle>Noch keine Gruppen</EmptyTitle>
							<EmptyDescription>
								Erstelle deine erste Gruppe, um loszulegen.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</FramePanel>
			</Frame>
		);
	}

	const nameFilterValue =
		(table.getColumn("name")?.getFilterValue() as string) ?? "";

	return (
		<>
			<InputGroup className="max-w-sm">
				<InputGroupAddon>
					<SearchIcon aria-hidden="true" />
				</InputGroupAddon>
				<InputGroupInput
					type="search"
					aria-label="Gruppen durchsuchen"
					placeholder="Gruppen durchsuchen..."
					value={nameFilterValue}
					onChange={(event) =>
						table.getColumn("name")?.setFilterValue(event.target.value)
					}
				/>
				{nameFilterValue && (
					<InputGroupAddon align="inline-end">
						<button
							type="button"
							onClick={() => table.getColumn("name")?.setFilterValue("")}
						>
							<XIcon aria-hidden="true" />
							<span className="sr-only">Suche löschen</span>
						</button>
					</InputGroupAddon>
				)}
			</InputGroup>

			<CardFrame>
				<Table variant="card">
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow className="hover:bg-transparent" key={headerGroup.id}>
							{headerGroup.headers.map((header, idx) => {
								const isLast = idx === headerGroup.headers.length - 1;
								const metaClassName = (header.column.columnDef.meta as { className?: string })?.className;
								return (
									<TableHead
										key={header.id}
										className={[isLast && "text-right", metaClassName].filter(Boolean).join(" ") || undefined}
									>
										{header.isPlaceholder ? null : header.column.getCanSort() ? (
											<button
												type="button"
												className={`flex h-full w-full cursor-pointer select-none items-center gap-2 ${metaClassName === "text-right" ? "justify-end" : "justify-between"}`}
												onClick={header.column.getToggleSortingHandler()}
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
									<TableCell key={`${rowKey}-${columnKey}`}>
										<Skeleton className="h-5 w-full" />
									</TableCell>
								))}
							</TableRow>
						))
					) : !table.getRowModel().rows?.length ? (
						<TableRow className="hover:bg-transparent">
							<TableCell colSpan={columns.length}>
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<SearchIcon />
										</EmptyMedia>
										<EmptyTitle>Keine Ergebnisse</EmptyTitle>
										<EmptyDescription>
											Keine Gruppe passt zu &ldquo;{nameFilterValue}&rdquo;.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
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
						<TableCell colSpan={columns.length} className="!py-2 px-2">
							<div className="flex items-center justify-between gap-2">
								<div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
									<p className="hidden text-muted-foreground text-sm sm:inline">Zeige</p>
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
											aria-label="Zeilen pro Seite"
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
											{table.getRowCount()}
										</strong>{" "}
										<span className="hidden sm:inline">
											{table.getRowCount() === 1
												? "Gruppe"
												: "Gruppen"}
										</span>
									</span>
								</div>
								<Pagination className="justify-end">
									<PaginationContent>
										<PaginationItem>
											<span className="text-muted-foreground text-sm">
												Seite {table.getState().pagination.pageIndex + 1} von{" "}
												{table.getPageCount()}
											</span>
										</PaginationItem>
										<PaginationItem>
											<PaginationPrevious
												render={
													<Button
														disabled={!table.getCanPreviousPage()}
														onClick={() => table.previousPage()}
														size="sm"
														variant="outline"
													/>
												}
											/>
										</PaginationItem>
										<PaginationItem>
											<PaginationNext
												render={
													<Button
														disabled={!table.getCanNextPage()}
														onClick={() => table.nextPage()}
														size="sm"
														variant="outline"
													/>
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
			</CardFrame>

			<DeleteGroupDialog
				group={groupToDelete}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onSuccess={onRefetch}
			/>

			<EditGroupSheet
				group={activeGroup}
				open={editGroupOpen}
				onOpenChange={setEditGroupOpen}
				onSuccess={onRefetch}
			/>
		</>
	);
}

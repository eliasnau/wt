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
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
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
import { client } from "@/utils/orpc";
import { EditGroupSheet, GroupMembersSheet } from "./group-sheets";

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
						Are you sure you want to delete "{group?.name}"? This action cannot
						be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose
						render={<Button variant="outline" />}
						disabled={deleteGroupMutation.isPending}
					>
						Cancel
					</AlertDialogClose>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteGroupMutation.isPending}
					>
						{deleteGroupMutation.isPending ? (
							<>
								<Spinner />
								Deleting...
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
	},
	{
		accessorKey: "description",
		header: "Description",
		enableSorting: false,
	},
	{
		accessorKey: "defaultMembershipPrice",
		header: "Mitgliedsbeitrag",
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row, table }) => {
			const group = row.original;
			const { onDeleteGroup, onEditGroup, onViewMembers } = table.options
				.meta as {
				onDeleteGroup: (group: GroupRow) => void;
				onEditGroup: (group: GroupRow) => void;
				onViewMembers: (group: GroupRow) => void;
			};

			return (
				<div className="flex items-center justify-end gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => onViewMembers(group)}
					>
						<UserIcon />
						Members
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
								Edit
							</MenuItem>
							<MenuSeparator />
							<MenuItem
								variant="destructive"
								onClick={() => onDeleteGroup(group)}
							>
								<TrashIcon />
								Delete Group
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
	const [membersSheetOpen, setMembersSheetOpen] = useState(false);
	const [activeGroup, setActiveGroup] = useState<GroupRow | null>(null);

	const handleDeleteGroup = (group: GroupRow) => {
		setGroupToDelete(group);
		setDeleteDialogOpen(true);
	};

	const handleEditGroup = (group: GroupRow) => {
		setActiveGroup(group);
		setEditGroupOpen(true);
	};

	const handleViewMembers = (group: GroupRow) => {
		setActiveGroup(group);
		setMembersSheetOpen(true);
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
			onViewMembers: handleViewMembers,
		},
		state: {
			pagination,
			sorting,
			columnFilters,
		},
	});

	// If there are no groups at all, show empty state
	if (!loading && !data?.length) {
		return (
			<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel className="py-12">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<UserIcon />
							</EmptyMedia>
							<EmptyTitle>Noch keine Gruppen</EmptyTitle>
							<EmptyDescription>
								Get started by creating your first group.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</FramePanel>
			</Frame>
		);
	}

	return (
		<div className="">
			<div className="mb-4">
				<InputGroup className="max-w-sm">
					<InputGroupAddon>
						<SearchIcon className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						type="text"
						placeholder="Name suchen..."
						value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
						onChange={(event) =>
							table.getColumn("name")?.setFilterValue(event.target.value)
						}
					/>
					{((table.getColumn("name")?.getFilterValue() as string) ?? "") !==
						"" && (
						<InputGroupAddon
							align={"inline-end"}
							className="cursor-pointer"
							onClick={() => table.getColumn("name")?.setFilterValue("")}
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
									{columns.map((column, colIdx) => (
										<TableCell key={`skeleton-${idx}-${colIdx}`}>
											<Skeleton className="h-5 w-full" />
										</TableCell>
									))}
								</TableRow>
							),
						)
					) : !table.getRowModel().rows?.length ? (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
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

			<GroupMembersSheet
				group={activeGroup}
				open={membersSheetOpen}
				onOpenChange={setMembersSheetOpen}
			/>
		</div>
	);
}

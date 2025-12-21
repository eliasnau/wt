"use client";
import type { inferProcedureOutput } from "@orpc/client";
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
import { useEffect, useState } from "react";
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
import type { orpc } from "@/utils/orpc";

type MembersListResponse = inferProcedureOutput<typeof orpc.members.list>;
type MemberRow = MembersListResponse["data"][number];

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
	onSearchChange: (search: string) => void;
	onPageChange: (page: number) => void;
	onLimitChange: (limit: number) => void;
	loading?: boolean;
}

export const columns: ColumnDef<MemberRow>[] = [
	{
		accessorKey: "firstName",
		header: "First Name",
	},
	{
		accessorKey: "lastName",
		header: "Last Name",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "phone",
		header: "Phone",
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => {
			const member = row.original;

			return (
				<div className="flex items-center justify-end gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => console.log("View member:", member)}
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
								onClick={() => console.log("Cancel membership:", member)}
							>
								<UserXIcon />
								Cancel Membership
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
	onSearchChange,
	onPageChange,
	onLimitChange,
	loading = false,
}: MembersTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [localSearch, setLocalSearch] = useState(search);

	useEffect(() => {
		setLocalSearch(search);
	}, [search]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (localSearch !== search) {
				onSearchChange(localSearch);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [localSearch, search, onSearchChange]);

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
		!loading && !data?.length && !search && pagination.totalCount === 0;

	if (hasNoMembers) {
		return (
			<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel className="py-12">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<UserIcon />
							</EmptyMedia>
							<EmptyTitle>No Members yet</EmptyTitle>
							<EmptyDescription>
								Get started by creating your first member.
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
						placeholder="Search by name or email..."
						value={localSearch}
						onChange={(event) => setLocalSearch(event.target.value)}
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
						Array.from({ length: pagination.limit }).map((_, idx) => (
							<TableRow key={`skeleton-${idx}`}>
								{columns.map((_column, colIdx) => (
									<TableCell key={`skeleton-${idx}-${colIdx}`}>
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
										{search
											? "No members found matching your filters."
											: "No results found."}
									</p>
									{search && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setLocalSearch("");
												onSearchChange("");
											}}
										>
											Clear filters
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
	);
}

"use client";

import {
	flexRender,
	getCoreRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	FilterIcon,
	SearchIcon,
	XIcon,
	MoreVerticalIcon,
	CheckCircleIcon,
	CalendarIcon,
	DownloadIcon,
	UploadIcon,
	SettingsIcon,
	UserCheckIcon,
	UserXIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Menu, MenuPopup, MenuItem, MenuTrigger } from "@/components/ui/menu";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/ui/frame";
import {
	Popover,
	PopoverPopup,
	PopoverTitle,
	PopoverDescription,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { createColumns } from "./columns";
import { members } from "./data";
import { EditMemberSheet } from "./edit-member-sheet";
import { EmptyMembers } from "./empty-members";
import type { Member } from "./types";

interface MembersTableProps {
	onGenerateQR?: () => void;
}

export function MembersTable({ onGenerateQR }: MembersTableProps) {
	const pageSize = 10;

	const [globalFilter, setGlobalFilter] = useState("");
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: pageSize,
	});

	const [sorting, setSorting] = useState<SortingState>([
		{
			desc: false,
			id: "name",
		},
	]);

	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<Member | null>(null);

	const handleEdit = (member: Member) => {
		setSelectedMember(member);
		setSheetOpen(true);
	};

	const allGroups = useMemo(
		() => Array.from(new Set(members.flatMap(({ groups }) => groups))).sort(),
		[],
	);

	const handleClearFilters = () => {
		setGlobalFilter("");
		setColumnFilters([]);
	};

	const table = useReactTable({
		columns: createColumns(handleEdit),
		data: members,
		enableSortingRemoval: false,
		getCoreRowModel: getCoreRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		state: {
			columnFilters,
			globalFilter,
			pagination,
			sorting,
		},
	});

	// If there are no members at all, show empty state
	if (members.length === 0) {
		return (
			<>
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel className="py-12">
						<EmptyMembers hasMembers={false} onGenerateQR={onGenerateQR || (() => {})} />
					</FramePanel>
				</Frame>
				<EditMemberSheet
					open={sheetOpen}
					onOpenChange={setSheetOpen}
					member={selectedMember}
				/>
			</>
		);
	}

	return (
		<>
			<section className="">
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<div className="flex-1 min-w-0 max-w-xs">
							<InputGroup>
								<InputGroupInput
									aria-label="Search"
									placeholder="Search members..."
									type="search"
									value={globalFilter}
									onChange={(e) => setGlobalFilter(e.target.value)}
								/>
								<InputGroupAddon>
									<SearchIcon />
								</InputGroupAddon>
								{globalFilter && (
									<InputGroupAddon align="inline-end">
										<button
											onClick={() => setGlobalFilter("")}
											className="text-muted-foreground hover:text-foreground"
											aria-label="Clear search"
											type="button"
										>
											<XIcon className="size-4" />
										</button>
									</InputGroupAddon>
								)}
							</InputGroup>
						</div>
						
						<div className="flex gap-2 flex-1">
							{table.getColumn("groups") && (
								<DataTableFacetedFilter
									column={table.getColumn("groups")}
									title="Groups"
									options={allGroups.map((group) => ({
										label: group,
										value: group,
									}))}
								/>
							)}
							
							<Button variant="outline">
								<CheckCircleIcon />
								Status
							</Button>
							
							<Button variant="outline">
								<CalendarIcon />
								Join Date
							</Button>
						</div>

						<div className="flex gap-2 sm:ml-auto">
							{(globalFilter || columnFilters.length > 0) && (
								<Button variant="ghost" onClick={handleClearFilters}>
									<XIcon />
									Clear filters
								</Button>
							)}
							
							<Popover>
								<PopoverTrigger
									render={
										<Button variant="outline">
											<MoreVerticalIcon />
										</Button>
									}
								/>
								<PopoverPopup className="w-80" align="end">
									<div className="mb-4">
										<PopoverTitle className="text-base">View Options</PopoverTitle>
										<PopoverDescription>
											Customize what members are displayed in the table.
										</PopoverDescription>
									</div>
									<div className="space-y-4">
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<Checkbox id="show-active" defaultChecked />
												<Label htmlFor="show-active" className="flex items-center gap-2 cursor-pointer">
													<UserCheckIcon className="size-4 text-muted-foreground" />
													<span>Show active members</span>
												</Label>
											</div>
											<div className="flex items-center gap-2">
												<Checkbox id="show-cancelled" />
												<Label htmlFor="show-cancelled" className="flex items-center gap-2 cursor-pointer">
													<UserXIcon className="size-4 text-muted-foreground" />
													<span>Show cancelled members</span>
												</Label>
											</div>
										</div>
										<div className="pt-3 border-t">
											<p className="text-sm text-muted-foreground">
												Need to import or export members?{" "}
												<a
													href="/dashboard/settings/import-export"
													className="text-foreground hover:underline"
												>
													Go to settings
												</a>
											</p>
										</div>
									</div>
								</PopoverPopup>
							</Popover>
						</div>
					</div>
				</div>
			</section>

			<Frame className="w-full flex flex-col">
				<ScrollArea
					orientation="horizontal"
					className="w-full"
					viewportClassName="w-full"
				>
					<Table className="table-fixed min-w-[800px]">
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow className="hover:bg-transparent" key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										const columnSize = header.column.getSize();
										return (
											<TableHead
												key={header.id}
												style={
													columnSize ? { width: `${columnSize}px` } : undefined
												}
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
																	className="size-4 shrink-0 opacity-72"
																/>
															),
															desc: (
																<ChevronDownIcon
																	aria-hidden="true"
																	className="size-4 shrink-0 opacity-72"
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
							{table.getRowModel().rows.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										data-state={row.getIsSelected() ? "selected" : undefined}
										key={row.id}
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
							) : (
								<TableRow>
									<TableCell className="h-auto py-12" colSpan={6}>
										<EmptyMembers hasMembers={true} />
										<div className="flex justify-center mt-4">
											<Button variant="outline" onClick={handleClearFilters}>
												<XIcon />
												Clear all filters
											</Button>
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</ScrollArea>

				<FrameFooter className="p-2">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
						<div className="flex items-center gap-2 whitespace-nowrap text-sm">
							<p className="text-muted-foreground">Results per page</p>
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
									aria-label="Select results per page"
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
							<p className="text-muted-foreground">
								of{" "}
								<strong className="font-medium text-foreground">
									{table.getRowCount()}
								</strong>{" "}
								total
							</p>
						</div>

						<div className="flex items-center justify-between gap-4 sm:justify-end">
							<p className="text-muted-foreground text-sm whitespace-nowrap">
								Page{" "}
								<strong className="font-medium text-foreground">
									{table.getState().pagination.pageIndex + 1}
								</strong>{" "}
								of{" "}
								<strong className="font-medium text-foreground">
									{table.getPageCount()}
								</strong>
							</p>
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
												/>
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
												/>
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					</div>
				</FrameFooter>
			</Frame>

			<EditMemberSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				member={selectedMember}
			/>
		</>
	);
}

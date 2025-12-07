"use client";

import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
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
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Frame, FrameFooter, FrameHeader } from "@/components/ui/frame";
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
import type { Member } from "./types";

interface MembersTableProps {}

export function MembersTable({}: MembersTableProps) {
	const pageSize = 10;

	const [globalFilter, setGlobalFilter] = useState("");
	const [selectedGroup, setSelectedGroup] = useState<string>("all");
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
		setSelectedGroup("all");
	};

	const filteredMembers = useMemo(() => {
		return members.filter((member) => {
			const matchesSearch = [member.name, member.email, member.phone]
				.filter(Boolean)
				.map((value) => value.toLowerCase())
				.some((value) => value.includes(globalFilter.toLowerCase()));

			const matchesGroup =
				selectedGroup === "all" || member.groups.includes(selectedGroup);

			return matchesSearch && matchesGroup;
		});
	}, [globalFilter, selectedGroup]);

	const table = useReactTable({
		columns: createColumns(handleEdit),
		data: filteredMembers,
		enableSortingRemoval: false,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		state: {
			pagination,
			sorting,
		},
	});

	return (
		<>
			<section className="">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-end">
					<div className="flex-1 min-w-0">
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
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<Select
							items={[
								{ label: "All Groups", value: "all" },
								...allGroups.map((group) => ({ label: group, value: group })),
							]}
							value={selectedGroup}
							onValueChange={(value) => setSelectedGroup(value as string)}
						>
							<SelectTrigger
								className="w-full min-w-[180px] sm:w-[200px]"
								size="sm"
							>
								<FilterIcon className="size-4" />
								<SelectValue placeholder="Filter by group" />
							</SelectTrigger>
							<SelectPopup>
								<SelectItem value="all">All Groups</SelectItem>
								{allGroups.map((group) => (
									<SelectItem key={group} value={group}>
										{group}
									</SelectItem>
								))}
							</SelectPopup>
						</Select>
						{(globalFilter || selectedGroup !== "all") && (
							<Button size="sm" variant="ghost" onClick={handleClearFilters}>
								<XIcon />
								<span className="hidden sm:inline">Clear filters</span>
							</Button>
						)}
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
									<TableCell className="h-24 text-center" colSpan={6}>
										No members found.
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

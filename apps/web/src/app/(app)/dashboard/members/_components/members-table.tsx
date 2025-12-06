"use client";

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
	FilterIcon,
	MailIcon,
	MoreVerticalIcon,
	PhoneIcon,
	SearchIcon,
	TrashIcon,
	UserIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Frame, FrameFooter } from "@/components/ui/frame";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Sheet,
	SheetPopup,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetPanel,
	SheetFooter,
} from "@/components/ui/sheet";
import {
	Menu,
	MenuPopup,
	MenuItem,
	MenuSeparator,
	MenuTrigger,
} from "@/components/ui/menu";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";

type Member = {
	id: string;
	name: string;
	email: string;
	phone: string;
	groups: string[];
};

const columns: (onEdit: (member: Member) => void) => ColumnDef<Member>[] = (
	onEdit,
) => [
	{
		cell: ({ row }) => (
			<Checkbox
				aria-label="Select row"
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
			/>
		),
		enableSorting: false,
		header: ({ table }) => {
			const isAllSelected = table.getIsAllPageRowsSelected();
			const isSomeSelected = table.getIsSomePageRowsSelected();
			return (
				<Checkbox
					aria-label="Select all rows"
					checked={isAllSelected}
					indeterminate={isSomeSelected && !isAllSelected}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				/>
			);
		},
		id: "select",
		size: 28,
	},
	{
		accessorKey: "name",
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				<div className="flex size-8 items-center justify-center rounded-full bg-muted">
					<UserIcon className="size-4 text-muted-foreground" />
				</div>
				<div className="font-medium">{row.getValue("name")}</div>
			</div>
		),
		header: "Name",
		size: 200,
	},
	{
		accessorKey: "email",
		cell: ({ row }) => (
			<div className="flex items-center gap-2 text-muted-foreground">
				<MailIcon className="size-4 shrink-0" />
				<span className="truncate">{row.getValue("email")}</span>
			</div>
		),
		header: "Email",
		size: 220,
	},
	{
		accessorKey: "phone",
		cell: ({ row }) => (
			<div className="flex items-center gap-2 text-muted-foreground">
				<PhoneIcon className="size-4 shrink-0" />
				<span className="tabular-nums">{row.getValue("phone")}</span>
			</div>
		),
		header: "Phone",
		size: 160,
	},
	{
		accessorKey: "groups",
		cell: ({ row }) => {
			const groups = row.getValue("groups") as string[];
			return (
				<div className="flex flex-wrap gap-1">
					{groups.map((group) => (
						<Badge key={group} variant="outline" size="sm">
							{group}
						</Badge>
					))}
				</div>
			);
		},
		filterFn: (row, id, value) => {
			const groups = row.getValue(id) as string[];
			return groups.includes(value);
		},
		header: "Groups",
		size: 200,
	},
	{
		cell: ({ row }) => (
			<div className="flex items-center justify-end gap-2">
				<Button
					size="sm"
					variant="outline"
					onClick={() => onEdit(row.original)}
				>
					<EditIcon />
					Edit
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
						<MenuItem>
							<UserIcon />
							View Profile
						</MenuItem>
						<MenuItem>
							<MailIcon />
							Send Email
						</MenuItem>
						<MenuSeparator />
						<MenuItem variant="destructive">
							<TrashIcon />
							Delete Member
						</MenuItem>
					</MenuPopup>
				</Menu>
			</div>
		),
		enableSorting: false,
		header: "Actions",
		id: "actions",
		size: 140,
	},
];

export function MembersTable() {
	const pageSize = 10;

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

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [selectedGroup, setSelectedGroup] = useState<string>("all");

	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<Member | null>(null);

	const handleEdit = (member: Member) => {
		setSelectedMember(member);
		setSheetOpen(true);
	};

	const allGroups = Array.from(
		new Set(members.flatMap((member) => member.groups)),
	).sort();

	const table = useReactTable({
		columns: columns(handleEdit),
		data: members,
		enableSortingRemoval: false,
		getCoreRowModel: getCoreRowModel(),
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
		globalFilterFn: (row, columnId, filterValue) => {
			const search = filterValue.toLowerCase();
			const name = row.getValue<string>("name")?.toLowerCase() || "";
			const email = row.getValue<string>("email")?.toLowerCase() || "";
			const phone = row.getValue<string>("phone")?.toLowerCase() || "";
			return (
				name.includes(search) ||
				email.includes(search) ||
				phone.includes(search)
			);
		},
	});

	return (
		<>
			<div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center">
				<div className="relative max-w-md">
					<InputGroup>
						<InputGroupInput
							aria-label="Search"
							placeholder="Search"
							type="search"
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
						/>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
						{globalFilter && (
							<InputGroupAddon align={"inline-end"}>
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
				<Select
					items={[
						{ label: "All Groups", value: "all" },
						...allGroups.map((group) => ({ label: group, value: group })),
					]}
					value={selectedGroup}
					onValueChange={(value) => {
						setSelectedGroup(value as string);
						if (value === "all") {
							setColumnFilters((prev) =>
								prev.filter((filter) => filter.id !== "groups"),
							);
						} else {
							setColumnFilters((prev) => [
								...prev.filter((filter) => filter.id !== "groups"),
								{ id: "groups", value },
							]);
						}
					}}
				>
					<SelectTrigger className="w-[180px]" size="sm">
						<FilterIcon className="size-4" />
						<SelectValue />
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
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							setGlobalFilter("");
							setSelectedGroup("all");
							setColumnFilters([]);
						}}
					>
						<XIcon />
						Clear
					</Button>
				)}
			</div>

			<Frame className="w-full">
				<Table className="table-fixed">
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
				<FrameFooter className="p-2">
					<div className="flex items-center justify-between gap-2">
						{/* Results per page selector */}
						<div className="flex items-center gap-2 whitespace-nowrap">
							<p className="text-muted-foreground text-sm">Results per page</p>
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
						</div>

						<div className="flex items-center gap-4">
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

			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetPopup inset>
					<SheetHeader>
						<SheetTitle>Edit Member</SheetTitle>
						<SheetDescription>
							Update member information and group assignments.
						</SheetDescription>
					</SheetHeader>
					<SheetPanel>
						<div className="space-y-4">
							<Field>
								<FieldLabel>Name</FieldLabel>
								<Input
									defaultValue={selectedMember?.name}
									placeholder="Enter member name"
								/>
							</Field>
							<Field>
								<FieldLabel>Email</FieldLabel>
								<Input
									type="email"
									defaultValue={selectedMember?.email}
									placeholder="email@example.com"
								/>
							</Field>
							<Field>
								<FieldLabel>Phone</FieldLabel>
								<Input
									type="tel"
									defaultValue={selectedMember?.phone}
									placeholder="+1 (555) 000-0000"
								/>
							</Field>
							<Field>
								<FieldLabel>Groups</FieldLabel>
								<Input
									defaultValue={selectedMember?.groups.join(", ")}
									placeholder="Enter groups separated by commas"
								/>
							</Field>
						</div>
					</SheetPanel>
					<SheetFooter>
						<Button variant="ghost" onClick={() => setSheetOpen(false)}>
							Cancel
						</Button>
						<Button onClick={() => setSheetOpen(false)}>Save Changes</Button>
					</SheetFooter>
				</SheetPopup>
			</Sheet>
		</>
	);
}

const members: Member[] = [
	{
		id: "1",
		name: "Sarah Johnson",
		email: "sarah.johnson@example.com",
		phone: "+1 (555) 123-4567",
		groups: ["Admin", "Engineering"],
	},
	{
		id: "2",
		name: "Michael Chen",
		email: "michael.chen@example.com",
		phone: "+1 (555) 234-5678",
		groups: ["Engineering", "Design"],
	},
	{
		id: "3",
		name: "Emily Rodriguez",
		email: "emily.rodriguez@example.com",
		phone: "+1 (555) 345-6789",
		groups: ["Marketing"],
	},
	{
		id: "4",
		name: "David Kim",
		email: "david.kim@example.com",
		phone: "+1 (555) 456-7890",
		groups: ["Sales", "Marketing"],
	},
	{
		id: "5",
		name: "Jessica Williams",
		email: "jessica.williams@example.com",
		phone: "+1 (555) 567-8901",
		groups: ["Engineering"],
	},
	{
		id: "6",
		name: "James Brown",
		email: "james.brown@example.com",
		phone: "+1 (555) 678-9012",
		groups: ["Admin", "Support"],
	},
	{
		id: "7",
		name: "Maria Garcia",
		email: "maria.garcia@example.com",
		phone: "+1 (555) 789-0123",
		groups: ["Design"],
	},
	{
		id: "8",
		name: "Robert Taylor",
		email: "robert.taylor@example.com",
		phone: "+1 (555) 890-1234",
		groups: ["Engineering", "Admin"],
	},
	{
		id: "9",
		name: "Jennifer Martinez",
		email: "jennifer.martinez@example.com",
		phone: "+1 (555) 901-2345",
		groups: ["Support"],
	},
	{
		id: "10",
		name: "William Anderson",
		email: "william.anderson@example.com",
		phone: "+1 (555) 012-3456",
		groups: ["Sales"],
	},
	{
		id: "11",
		name: "Linda Thomas",
		email: "linda.thomas@example.com",
		phone: "+1 (555) 123-4568",
		groups: ["Marketing", "Design"],
	},
	{
		id: "12",
		name: "Christopher Lee",
		email: "christopher.lee@example.com",
		phone: "+1 (555) 234-5679",
		groups: ["Engineering"],
	},
	{
		id: "13",
		name: "Patricia White",
		email: "patricia.white@example.com",
		phone: "+1 (555) 345-6780",
		groups: ["Admin"],
	},
	{
		id: "14",
		name: "Daniel Harris",
		email: "daniel.harris@example.com",
		phone: "+1 (555) 456-7891",
		groups: ["Support", "Engineering"],
	},
	{
		id: "15",
		name: "Barbara Clark",
		email: "barbara.clark@example.com",
		phone: "+1 (555) 567-8902",
		groups: ["Sales", "Marketing"],
	},
	{
		id: "16",
		name: "Matthew Lewis",
		email: "matthew.lewis@example.com",
		phone: "+1 (555) 678-9013",
		groups: ["Design"],
	},
	{
		id: "17",
		name: "Susan Walker",
		email: "susan.walker@example.com",
		phone: "+1 (555) 789-0124",
		groups: ["Engineering", "Support"],
	},
	{
		id: "18",
		name: "Joseph Hall",
		email: "joseph.hall@example.com",
		phone: "+1 (555) 890-1235",
		groups: ["Marketing"],
	},
	{
		id: "19",
		name: "Karen Allen",
		email: "karen.allen@example.com",
		phone: "+1 (555) 901-2346",
		groups: ["Admin", "Sales"],
	},
	{
		id: "20",
		name: "Thomas Young",
		email: "thomas.young@example.com",
		phone: "+1 (555) 012-3457",
		groups: ["Engineering"],
	},
	{
		id: "21",
		name: "Nancy King",
		email: "nancy.king@example.com",
		phone: "+1 (555) 123-4569",
		groups: ["Design", "Marketing"],
	},
	{
		id: "22",
		name: "Charles Wright",
		email: "charles.wright@example.com",
		phone: "+1 (555) 234-5680",
		groups: ["Support"],
	},
	{
		id: "23",
		name: "Lisa Lopez",
		email: "lisa.lopez@example.com",
		phone: "+1 (555) 345-6781",
		groups: ["Sales"],
	},
	{
		id: "24",
		name: "Paul Hill",
		email: "paul.hill@example.com",
		phone: "+1 (555) 456-7892",
		groups: ["Engineering", "Admin"],
	},
	{
		id: "25",
		name: "Sandra Scott",
		email: "sandra.scott@example.com",
		phone: "+1 (555) 567-8903",
		groups: ["Marketing"],
	},
];

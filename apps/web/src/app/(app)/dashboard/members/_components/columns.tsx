import type { ColumnDef } from "@tanstack/react-table";
import {
	EditIcon,
	MailIcon,
	MoreVerticalIcon,
	PhoneIcon,
	TrashIcon,
	UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Menu,
	MenuPopup,
	MenuItem,
	MenuSeparator,
	MenuTrigger,
} from "@/components/ui/menu";
import type { Member } from "./types";

export const createColumns = (
	onEdit: (member: Member) => void,
): ColumnDef<Member>[] => [
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

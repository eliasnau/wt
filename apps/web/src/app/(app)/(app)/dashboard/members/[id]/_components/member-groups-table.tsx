"use client";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  MoreVerticalIcon,
  TrashIcon,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
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

interface MemberGroup {
  groupId: string;
  membershipPrice: string | null;
  group: {
    id: string;
    name: string;
    description: string | null;
    defaultMembershipPrice: string | null;
  };
}

interface MemberGroupsTableProps {
  groups: MemberGroup[];
  loading?: boolean;
}

function formatCurrency(amount: string | null | undefined) {
  if (!amount) return "€0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(Number.parseFloat(amount));
}

export const columns: ColumnDef<MemberGroup>[] = [
  {
    accessorKey: "group.name",
    header: "Group Name",
    cell: ({ row }) => {
      const gm = row.original;
      const isDefaultPrice =
        !gm.membershipPrice && gm.group.defaultMembershipPrice;
      return (
        <div className="flex items-center gap-2">
          <span>{gm.group.name}</span>
          {isDefaultPrice && (
            <Badge variant="outline" className="text-xs">
              Default
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "group.description",
    header: "Description",
    enableSorting: false,
    cell: ({ row }) => row.original.group.description || "—",
  },
  {
    id: "price",
    header: "Monthly Price",
    cell: ({ row }) => {
      const gm = row.original;
      const price =
        gm.membershipPrice || gm.group.defaultMembershipPrice || "0";
      return formatCurrency(price);
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const group = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Menu>
            <MenuTrigger
              render={
                <Button size="sm" variant="outline">
                  <MoreVerticalIcon />
                </Button>
              }
            />
            <MenuPopup align="end">
              <MenuItem onClick={() => console.log("Edit price:", group)}>
                <EditIcon />
                Edit Price
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                variant="destructive"
                onClick={() => console.log("Remove from group:", group)}
              >
                <TrashIcon />
                Remove from Group
              </MenuItem>
            </MenuPopup>
          </Menu>
        </div>
      );
    },
  },
];

export function MemberGroupsTable({
  groups,
  loading = false,
}: MemberGroupsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      desc: false,
      id: "group.name",
    },
  ]);

  const table = useReactTable({
    data: groups || [],
    columns,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const totalMonthly = groups.reduce((sum, gm) => {
    const price = gm.membershipPrice || gm.group.defaultMembershipPrice || "0";
    return sum + Number.parseFloat(price);
  }, 0);

  // If there are no groups at all, show empty state
  if (!loading && !groups?.length) {
    return (
      <Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
        <FramePanel className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>Not a member of any groups</EmptyTitle>
              <EmptyDescription>
                Assign this member to a group to get started.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </FramePanel>
      </Frame>
    );
  }

  return (
    <div className="">
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
            Array.from({ length: 3 }).map((_, idx) => (
              <TableRow key={`skeleton-${idx}`}>
                {columns.map((column, colIdx) => (
                  <TableCell key={`skeleton-${idx}-${colIdx}`}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
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
                  <span className="font-semibold text-foreground">
                    Total Monthly from Groups:
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(totalMonthly.toFixed(2))}
                  </span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

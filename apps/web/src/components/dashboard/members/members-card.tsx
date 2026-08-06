"use client";

import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import { CardFrame } from "@matdesk/ui/components/card";
import { Checkbox } from "@matdesk/ui/components/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@matdesk/ui/components/menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@matdesk/ui/components/pagination";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@matdesk/ui/components/toolbar";
import { cn } from "@matdesk/ui/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
  ArrowUpDownIcon,
  BoxesIcon,
  ChevronsUpDownIcon,
  Columns3Icon,
  DownloadIcon,
  EditIcon,
  ExternalLinkIcon,
  EyeIcon,
  ListFilterIcon,
  Loader2Icon,
  MailIcon,
  MapIcon,
  MoreVerticalIcon,
  PhoneIcon,
  PrinterIcon,
  SearchIcon,
  UsersIcon,
  UserXIcon,
  XIcon,
} from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";

import {
  AdvancedFilters,
  type FilterClause,
} from "@/components/dashboard/members/advanced-filters";
import { UserAvatar } from "@/components/auth/user-avatar";
import { orpc } from "@/utils/orpc";

type MemberStatus = "active" | "cancelled_but_active" | "cancelled";

const STATUS_META: Record<
  MemberStatus,
  { label: string; variant: "success" | "secondary" | "warning"; dot: string }
> = {
  active: { label: "Aktiv", variant: "success", dot: "bg-emerald-500" },
  cancelled_but_active: { label: "Gekündigt", variant: "warning", dot: "bg-amber-500" },
  cancelled: { label: "Beendet", variant: "secondary", dot: "bg-muted-foreground" },
};

const STATUS_OPTIONS: Array<{ value: MemberStatus; label: string }> = [
  { value: "active", label: "Aktiv" },
  { value: "cancelled_but_active", label: "Gekündigt" },
  { value: "cancelled", label: "Beendet" },
];

// Default view: active + cancelled-but-still-active, hiding fully-ended memberships.
const DEFAULT_STATUSES: MemberStatus[] = ["active", "cancelled_but_active"];

const PAGE_SIZES = [10, 20, 30, 50];

type ColumnKey = "email" | "phone" | "groups" | "status";

const TOGGLE_COLUMNS: Array<{ key: ColumnKey; label: string }> = [
  { key: "email", label: "E-Mail" },
  { key: "phone", label: "Telefon" },
  { key: "groups", label: "Gruppen" },
  { key: "status", label: "Status" },
];

type SortFieldOption = "createdAt" | "lastName" | "firstName" | "email";

const SORT_OPTIONS: Array<{ value: SortFieldOption; label: string }> = [
  { value: "createdAt", label: "Erstellt" },
  { value: "lastName", label: "Nachname" },
  { value: "firstName", label: "Vorname" },
  { value: "email", label: "E-Mail" },
];

function groupBadgeStyle(color: string): CSSProperties {
  return { color, borderColor: `${color}66`, backgroundColor: `${color}1A` };
}

export function MembersCard() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Set<MemberStatus>>(new Set(DEFAULT_STATUSES));
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterClause[]>([]);
  const [filterMode, setFilterMode] = useState<"and" | "or">("and");
  const [sortField, setSortField] = useState<SortFieldOption>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(["email", "phone", "groups", "status"]),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const groupsQuery = useQuery(orpc.groups.list.queryOptions({}));
  const groupOptions = (groupsQuery.data ?? []).map((g) => ({ id: g.id, name: g.name }));

  // Debounce the search box; reset to the first page on a new term.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const membersQuery = useQuery(
    orpc.members.query.queryOptions({
      input: {
        page,
        limit,
        search: search || undefined,
        statuses: statuses.size > 0 ? Array.from(statuses) : undefined,
        groups:
          selectedGroups.size > 0
            ? { mode: "any" as const, ids: Array.from(selectedGroups) }
            : undefined,
        filterMode,
        filters: filters.length > 0 ? filters : undefined,
        sort: { field: sortField, direction: sortDirection },
      },
      placeholderData: keepPreviousData,
    }),
  );

  const members = membersQuery.data?.data ?? [];
  const pagination = membersQuery.data?.pagination;

  const allSelected = members.length > 0 && members.every((m) => selected.has(m.id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(members.map((m) => m.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleStatus(value: MemberStatus) {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    setPage(1);
  }

  function toggleGroup(id: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setPage(1);
  }

  function toggleColumn(key: ColumnKey) {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const statusesAreDefault =
    statuses.size === DEFAULT_STATUSES.length && DEFAULT_STATUSES.every((s) => statuses.has(s));
  const hasFilters =
    search.length > 0 || !statusesAreDefault || selectedGroups.size > 0 || filters.length > 0;
  // select + name + toggleable columns + actions
  const columnCount = 2 + visibleColumns.size + 1;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatuses(new Set(DEFAULT_STATUSES));
    setSelectedGroups(new Set());
    setFilters([]);
    setFilterMode("and");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <InputGroup className="w-full sm:w-72">
            <InputGroupAddon>
              {membersQuery.isFetching ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
            </InputGroupAddon>
            <InputGroupInput
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Mitglieder suchen…"
              value={searchInput}
            />
          </InputGroup>
          <Button
            aria-label="Mitgliederkarte öffnen"
            render={<Link to="/dashboard/statistics/members" />}
            size="icon"
            variant="outline"
          >
            <MapIcon />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdvancedFilters
            filterMode={filterMode}
            filters={filters}
            onApply={(next, mode) => {
              setFilters(next);
              setFilterMode(mode);
              setPage(1);
            }}
          />

          <Menu>
            <MenuTrigger render={<Button variant="outline" />}>
              <BoxesIcon />
              Gruppen
              {selectedGroups.size > 0 ? (
                <span className="ml-1 rounded bg-primary/10 px-1.5 text-primary text-xs">
                  {selectedGroups.size}
                </span>
              ) : null}
            </MenuTrigger>
            <MenuPopup align="end" className="w-52">
              <MenuGroup>
                <MenuGroupLabel>Nach Gruppe filtern</MenuGroupLabel>
                {groupOptions.length === 0 ? (
                  <p className="px-2 py-1.5 text-muted-foreground text-sm">Keine Gruppen</p>
                ) : (
                  groupOptions.map((group) => (
                    <MenuCheckboxItem
                      key={group.id}
                      checked={selectedGroups.has(group.id)}
                      closeOnClick={false}
                      onCheckedChange={() => toggleGroup(group.id)}
                    >
                      {group.name}
                    </MenuCheckboxItem>
                  ))
                )}
              </MenuGroup>
            </MenuPopup>
          </Menu>

          <Menu>
            <MenuTrigger render={<Button variant="outline" />}>
              <ListFilterIcon />
              Status
              {statuses.size > 0 && !statusesAreDefault ? (
                <span className="ml-1 rounded bg-primary/10 px-1.5 text-primary text-xs">
                  {statuses.size}
                </span>
              ) : null}
            </MenuTrigger>
            <MenuPopup align="end" className="w-48">
              <MenuGroup>
                <MenuGroupLabel>Status</MenuGroupLabel>
                {STATUS_OPTIONS.map((option) => (
                  <MenuCheckboxItem
                    key={option.value}
                    checked={statuses.has(option.value)}
                    closeOnClick={false}
                    onCheckedChange={() => toggleStatus(option.value)}
                  >
                    {option.label}
                  </MenuCheckboxItem>
                ))}
              </MenuGroup>
            </MenuPopup>
          </Menu>

          <Menu>
            <MenuTrigger render={<Button variant="outline" />}>
              <ArrowUpDownIcon />
              Sortieren
            </MenuTrigger>
            <MenuPopup align="end" className="w-52">
              <MenuGroup>
                <MenuGroupLabel>Sortieren nach</MenuGroupLabel>
                <MenuRadioGroup
                  onValueChange={(value) => {
                    setSortField(value as SortFieldOption);
                    setPage(1);
                  }}
                  value={sortField}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>
              <MenuSeparator />
              <MenuGroup>
                <MenuRadioGroup
                  onValueChange={(value) => setSortDirection(value as "asc" | "desc")}
                  value={sortDirection}
                >
                  <MenuRadioItem value="asc">Aufsteigend</MenuRadioItem>
                  <MenuRadioItem value="desc">Absteigend</MenuRadioItem>
                </MenuRadioGroup>
              </MenuGroup>
            </MenuPopup>
          </Menu>

          <Menu>
            <MenuTrigger aria-label="Spalten" render={<Button size="icon" variant="outline" />}>
              <Columns3Icon />
            </MenuTrigger>
            <MenuPopup align="end" className="w-44">
              <MenuGroup>
                <MenuGroupLabel>Spalten</MenuGroupLabel>
                {TOGGLE_COLUMNS.map((column) => (
                  <MenuCheckboxItem
                    key={column.key}
                    checked={visibleColumns.has(column.key)}
                    closeOnClick={false}
                    onCheckedChange={() => toggleColumn(column.key)}
                  >
                    {column.label}
                  </MenuCheckboxItem>
                ))}
              </MenuGroup>
            </MenuPopup>
          </Menu>

          <Menu>
            <MenuTrigger
              aria-label="Weitere Aktionen"
              render={<Button size="icon" variant="outline" />}
            >
              <MoreVerticalIcon />
            </MenuTrigger>
            <MenuPopup align="end" className="w-44">
              <MenuItem>
                <PrinterIcon />
                Drucken
              </MenuItem>
              <MenuItem>
                <DownloadIcon />
                CSV exportieren
              </MenuItem>
            </MenuPopup>
          </Menu>

          {hasFilters ? (
            <Button onClick={clearFilters} variant="ghost">
              <XIcon />
              Zurücksetzen
            </Button>
          ) : null}
        </div>
      </div>

      {membersQuery.isError ? (
        <CardFrame className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-muted-foreground text-sm">{parseError(membersQuery.error).message}</p>
          <Button onClick={() => membersQuery.refetch()} size="sm" variant="outline">
            Erneut versuchen
          </Button>
        </CardFrame>
      ) : (
        <CardFrame className="w-full min-w-0 overflow-hidden">
          <Table className="min-w-[920px]" variant="card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-px">
                  <Checkbox
                    aria-label="Alle Mitglieder auswählen"
                    checked={allSelected}
                    disabled={members.length === 0}
                    indeterminate={someSelected}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Mitglied</TableHead>
                {visibleColumns.has("email") ? <TableHead>E-Mail</TableHead> : null}
                {visibleColumns.has("phone") ? <TableHead>Telefon</TableHead> : null}
                {visibleColumns.has("groups") ? <TableHead>Gruppen</TableHead> : null}
                {visibleColumns.has("status") ? <TableHead>Status</TableHead> : null}
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersQuery.isPending ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="w-px">
                      <Skeleton className="size-4.5 rounded-[.25rem]" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-7 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </TableCell>
                    {visibleColumns.has("email") ? (
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                    ) : null}
                    {visibleColumns.has("phone") ? (
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                    ) : null}
                    {visibleColumns.has("groups") ? (
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                    ) : null}
                    {visibleColumns.has("status") ? (
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell className="p-0" colSpan={columnCount}>
                    {hasFilters ? (
                      <Empty className="py-12">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <SearchIcon />
                          </EmptyMedia>
                          <EmptyTitle>Keine Ergebnisse</EmptyTitle>
                          <EmptyDescription>
                            Keine Mitglieder entsprechen den aktuellen Filtern.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button onClick={clearFilters} size="sm" variant="outline">
                            Filter zurücksetzen
                          </Button>
                        </EmptyContent>
                      </Empty>
                    ) : (
                      <Empty className="py-12">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <UsersIcon />
                          </EmptyMedia>
                          <EmptyTitle>Noch keine Mitglieder</EmptyTitle>
                          <EmptyDescription>
                            Lege dein erstes Mitglied an, um loszulegen.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const status = STATUS_META[member.membershipStatus];
                  const isSelected = selected.has(member.id);
                  return (
                    <TableRow
                      key={member.id}
                      className={isSelected ? "bg-primary/4 hover:bg-primary/6" : undefined}
                    >
                      <TableCell className="w-px">
                        <Checkbox
                          aria-label={`${member.firstName} ${member.lastName} auswählen`}
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(member.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            className="size-7"
                            name={`${member.firstName} ${member.lastName}`}
                            seed={member.id}
                          />
                          <Link
                            className="font-medium text-foreground hover:underline"
                            params={{ memberId: member.id }}
                            to="/dashboard/members/$memberId"
                          >
                            {member.firstName} {member.lastName}
                          </Link>
                        </div>
                      </TableCell>
                      {visibleColumns.has("email") ? (
                        <TableCell className="text-muted-foreground">
                          {member.email || "—"}
                        </TableCell>
                      ) : null}
                      {visibleColumns.has("phone") ? (
                        <TableCell className="text-muted-foreground">
                          {member.phone || "—"}
                        </TableCell>
                      ) : null}
                      {visibleColumns.has("groups") ? (
                        <TableCell>
                          {member.groupMembers.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {member.groupMembers.map((gm) => (
                                <Badge
                                  key={gm.groupId}
                                  style={groupBadgeStyle(gm.group.color)}
                                  variant="outline"
                                >
                                  {gm.group.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      ) : null}
                      {visibleColumns.has("status") ? (
                        <TableCell>
                          <Badge variant={status.variant}>
                            <span
                              aria-hidden="true"
                              className={cn("size-1.5 rounded-full", status.dot)}
                            />
                            {status.label}
                          </Badge>
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            render={
                              <Link
                                params={{ memberId: member.id }}
                                to="/dashboard/members/$memberId"
                              />
                            }
                            size="sm"
                            variant="outline"
                          >
                            <EyeIcon />
                            Info
                          </Button>
                          <Menu>
                            <MenuTrigger
                              render={
                                <Button aria-label="Weitere Aktionen" size="sm" variant="outline">
                                  <MoreVerticalIcon />
                                </Button>
                              }
                            />
                            <MenuPopup align="end">
                              <MenuItem
                                render={
                                  <Link
                                    params={{ memberId: member.id }}
                                    target="_blank"
                                    to="/dashboard/members/$memberId"
                                  />
                                }
                              >
                                <ExternalLinkIcon />
                                In neuem Tab öffnen
                              </MenuItem>
                              <MenuItem>
                                <EditIcon />
                                Bearbeiten
                              </MenuItem>
                              <MenuSeparator />
                              <MenuItem>
                                <MailIcon />
                                E-Mail senden
                              </MenuItem>
                              <MenuItem>
                                <PhoneIcon />
                                Anrufen
                              </MenuItem>
                              <MenuSeparator />
                              <MenuItem variant="destructive">
                                <UserXIcon />
                                Mitgliedschaft kündigen
                              </MenuItem>
                            </MenuPopup>
                          </Menu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="px-2 !py-2" colSpan={columnCount}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                      <span className="hidden text-muted-foreground text-sm sm:inline">Zeige</span>
                      <Menu>
                        <MenuTrigger
                          aria-label="Einträge pro Seite"
                          render={<Button className="gap-1.5" size="sm" variant="outline" />}
                        >
                          {limit}
                          <ChevronsUpDownIcon className="size-3.5 opacity-60" />
                        </MenuTrigger>
                        <MenuPopup align="start" className="min-w-0">
                          <MenuRadioGroup
                            onValueChange={(value) => {
                              setLimit(Number(value));
                              setPage(1);
                            }}
                            value={String(limit)}
                          >
                            {PAGE_SIZES.map((value) => (
                              <MenuRadioItem key={value} value={String(value)}>
                                {value}
                              </MenuRadioItem>
                            ))}
                          </MenuRadioGroup>
                        </MenuPopup>
                      </Menu>
                      <span className="text-muted-foreground text-sm">
                        von{" "}
                        <strong className="font-medium text-foreground">
                          {pagination?.totalCount ?? 0}
                        </strong>{" "}
                        <span className="hidden sm:inline">Mitgliedern</span>
                      </span>
                    </div>
                    <Pagination className="justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <span className="text-muted-foreground text-sm">
                            Seite {pagination?.page ?? 1} von {pagination?.totalPages ?? 1}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationPrevious
                            render={
                              <Button
                                disabled={!pagination?.hasPreviousPage}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                                disabled={!pagination?.hasNextPage}
                                onClick={() => setPage((p) => p + 1)}
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
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
        <Toolbar
          aria-label="Aktionen für ausgewählte Mitglieder"
          className={cn(
            "transition-all duration-200 ease-out",
            selected.size > 0
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0",
          )}
        >
          <ToolbarGroup>
            <p className="px-2 font-medium text-sm leading-none">{selected.size} ausgewählt</p>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <ToolbarButton render={<Button size="sm" variant="outline" />}>
              <DownloadIcon />
              <span className="hidden sm:inline">CSV exportieren</span>
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <ToolbarButton
              render={<Button onClick={() => setSelected(new Set())} size="sm" variant="ghost" />}
            >
              <XIcon />
              <span className="hidden sm:inline">Abwählen</span>
            </ToolbarButton>
          </ToolbarGroup>
        </Toolbar>
      </div>
    </div>
  );
}

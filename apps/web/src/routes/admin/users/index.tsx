import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import { CardFrame } from "@matdesk/ui/components/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@matdesk/ui/components/pagination";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@matdesk/ui/components/menu";
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
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
  ChevronRightIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { UserAvatar } from "@/components/auth/user-avatar";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/users/")({
  component: RouteComponent,
});

const PAGE_SIZES = [10, 20, 30, 50];

function RouteComponent() {
  const [createOpen, setCreateOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", { search, page, limit }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit,
          offset: (page - 1) * limit,
          ...(search
            ? {
                searchValue: search,
                // Search names by default; switch to email when it looks like one.
                searchField: search.includes("@") ? ("email" as const) : ("name" as const),
                searchOperator: "contains" as const,
              }
            : {}),
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const users = usersQuery.data?.users ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Benutzer</h1>
          <p className="mt-1 text-sm text-muted-foreground">Alle Benutzerkonten der Plattform.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Benutzer erstellen
        </Button>
      </div>

      <InputGroup className="max-w-xs">
        <InputGroupAddon>
          {usersQuery.isFetching ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
        </InputGroupAddon>
        <InputGroupInput
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Nach Name oder E-Mail suchen…"
          value={searchInput}
        />
      </InputGroup>

      <CardFrame className="w-full min-w-0 overflow-hidden">
        <Table className="min-w-[640px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Benutzer</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isPending ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-7 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={3}>
                  {parseError(usersQuery.error).message}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={3}>
                  Keine Benutzer gefunden.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      className="flex items-center gap-3 hover:underline"
                      params={{ userId: user.id }}
                      to="/admin/users/$userId"
                    >
                      <UserAvatar
                        className="size-7"
                        image={user.image}
                        name={user.name}
                        seed={user.id}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">{user.name}</p>
                          {user.role === "admin" ? <Badge>Admin</Badge> : null}
                          {user.banned ? <Badge variant="destructive">Gesperrt</Badge> : null}
                        </div>
                        <p className="truncate text-muted-foreground text-xs">{user.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell className="w-px">
                    <Button
                      aria-label="Details"
                      render={<Link params={{ userId: user.id }} to="/admin/users/$userId" />}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ChevronRightIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="px-2 !py-2" colSpan={3}>
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
                      von <strong className="font-medium text-foreground">{total}</strong>{" "}
                      <span className="hidden sm:inline">Benutzern</span>
                    </span>
                  </div>
                  <Pagination className="justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <span className="text-muted-foreground text-sm">
                          Seite {page} von {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationPrevious
                          render={
                            <Button
                              disabled={page <= 1}
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
                              disabled={page >= totalPages}
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

      <CreateUserDialog onOpenChange={setCreateOpen} open={createOpen} />
    </div>
  );
}

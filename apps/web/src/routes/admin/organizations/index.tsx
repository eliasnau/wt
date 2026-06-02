import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import { CardFrame } from "@matdesk/ui/components/card";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@matdesk/ui/components/input-group";
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
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import { ChevronRightIcon, Loader2Icon, PlusIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { CreateOrgDialog } from "@/components/admin/create-org-dialog";
import { OrganizationAvatar } from "@/components/auth/organization-avatar";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/organizations/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [createOpen, setCreateOpen] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setSearch(searchInput);
			setPage(1);
		}, 300);
		return () => clearTimeout(timeout);
	}, [searchInput]);

	const orgsQuery = useQuery(
		orpc.admin.organizations.list.queryOptions({
			input: { search: search || undefined, page, limit: 20 },
			placeholderData: keepPreviousData,
		}),
	);

	const organizations = orgsQuery.data?.data ?? [];
	const pagination = orgsQuery.data?.pagination;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Organisationen</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Erstelle und verwalte alle Organisationen der Plattform.
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)}>
					<PlusIcon />
					Organisation erstellen
				</Button>
			</div>

			<InputGroup className="max-w-xs">
				<InputGroupAddon>
					{orgsQuery.isFetching ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
				</InputGroupAddon>
				<InputGroupInput
					onChange={(e) => setSearchInput(e.target.value)}
					placeholder="Nach Name oder Slug suchen…"
					value={searchInput}
				/>
			</InputGroup>

			<CardFrame className="w-full min-w-0 overflow-hidden">
				<Table className="min-w-[640px]" variant="card">
					<TableHeader>
						<TableRow>
							<TableHead>Organisation</TableHead>
							<TableHead>Slug</TableHead>
							<TableHead>Mitglieder</TableHead>
							<TableHead>Erstellt</TableHead>
							<TableHead className="w-px" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{orgsQuery.isPending ? (
							Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={`skeleton-${i}`}>
									<TableCell>
										<div className="flex items-center gap-3">
											<Skeleton className="size-8 rounded-md" />
											<Skeleton className="h-4 w-32" />
										</div>
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-8" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-20" />
									</TableCell>
									<TableCell />
								</TableRow>
							))
						) : orgsQuery.isError ? (
							<TableRow>
								<TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
									{parseError(orgsQuery.error).message}
								</TableCell>
							</TableRow>
						) : organizations.length === 0 ? (
							<TableRow>
								<TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
									Noch keine Organisationen.
								</TableCell>
							</TableRow>
						) : (
							organizations.map((org) => (
								<TableRow key={org.id}>
									<TableCell>
										<Link
											className="flex items-center gap-3 font-medium hover:underline"
											params={{ orgId: org.id }}
											to="/admin/organizations/$orgId"
										>
											<OrganizationAvatar
												className="size-8"
												id={org.id}
												logo={org.logo}
												name={org.name}
											/>
											{org.name}
										</Link>
									</TableCell>
									<TableCell className="text-muted-foreground">{org.slug}</TableCell>
									<TableCell>
										<Badge variant="secondary">{org.memberCount}</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{new Date(org.createdAt).toLocaleDateString("de-DE")}
									</TableCell>
									<TableCell className="w-px">
										<Button
											aria-label="Details"
											render={
												<Link params={{ orgId: org.id }} to="/admin/organizations/$orgId" />
											}
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
							<TableCell className="px-2 !py-2" colSpan={5}>
								<div className="flex items-center justify-between gap-2">
									<span className="text-muted-foreground text-sm">
										<strong className="font-medium text-foreground">
											{pagination?.totalCount ?? 0}
										</strong>{" "}
										Organisationen
									</span>
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

			<CreateOrgDialog onOpenChange={setCreateOpen} open={createOpen} />
		</div>
	);
}

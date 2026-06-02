import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import { CardFrame } from "@matdesk/ui/components/card";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@matdesk/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import { ArrowLeftIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";

import { AddMemberDialog } from "@/components/admin/add-member-dialog";
import { OrganizationAvatar } from "@/components/auth/organization-avatar";
import { UserAvatar } from "@/components/auth/user-avatar";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/organizations/$orgId")({
	component: RouteComponent,
});

function roleBadgeVariant(role: string) {
	if (role === "owner") return "default" as const;
	if (role === "admin") return "secondary" as const;
	return "outline" as const;
}

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-xl border bg-card px-4 py-3">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="font-semibold text-2xl tabular-nums">{value}</p>
		</div>
	);
}

function RouteComponent() {
	const { orgId } = Route.useParams();
	const [addOpen, setAddOpen] = useState(false);

	const orgQuery = useQuery(
		orpc.admin.organizations.get.queryOptions({ input: { organizationId: orgId } }),
	);

	const org = orgQuery.data;
	const members = org?.members ?? [];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<Button
					className="-ml-2 mb-2 text-muted-foreground"
					render={<Link to="/admin/organizations" />}
					size="sm"
					variant="ghost"
				>
					<ArrowLeftIcon />
					Organisationen
				</Button>

				{orgQuery.isPending ? (
					<div className="flex items-center gap-4">
						<Skeleton className="size-12 rounded-lg" />
						<div className="space-y-2">
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-32" />
						</div>
					</div>
				) : orgQuery.isError ? (
					<p className="text-muted-foreground text-sm">{parseError(orgQuery.error).message}</p>
				) : org ? (
					<div className="flex items-center gap-4">
						<OrganizationAvatar
							className="size-12 rounded-lg"
							id={org.id}
							logo={org.logo}
							name={org.name}
						/>
						<div>
							<h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
							<p className="text-muted-foreground text-sm">{org.slug}</p>
						</div>
					</div>
				) : null}
			</div>

			{org ? (
				<>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<StatCard label="Mitglieder" value={org.stats.totalMembers} />
						<StatCard label="Aktive Mitglieder" value={org.stats.activeMembers} />
						<StatCard label="Gruppen" value={org.stats.groups} />
						<StatCard label="Team" value={org.stats.team} />
					</div>

					<div>
						<div className="mb-3 flex items-end justify-between gap-4">
							<div>
								<h2 className="font-semibold text-lg">Team</h2>
								<p className="text-muted-foreground text-sm">
									{members.length} Benutzer mit Zugriff auf diese Organisation.
								</p>
							</div>
							<Button onClick={() => setAddOpen(true)} size="sm">
								<UserPlusIcon />
								Hinzufügen
							</Button>
						</div>
					<CardFrame className="w-full min-w-0 overflow-hidden">
						<Table className="min-w-[560px]" variant="card">
							<TableHeader>
								<TableRow>
									<TableHead>Benutzer</TableHead>
									<TableHead>Rolle</TableHead>
									<TableHead className="text-right">Beigetreten</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{members.length === 0 ? (
									<TableRow>
										<TableCell className="py-8 text-center text-muted-foreground" colSpan={3}>
											Keine Mitglieder.
										</TableCell>
									</TableRow>
								) : (
									members.map((member) => (
										<TableRow key={member.id}>
											<TableCell>
												<Link
													className="flex items-center gap-3 hover:underline"
													params={{ userId: member.userId }}
													to="/admin/users/$userId"
												>
													<UserAvatar
														className="size-7"
														image={member.user.image}
														name={member.user.name}
														seed={member.userId}
													/>
													<div className="min-w-0">
														<p className="truncate font-medium text-foreground">
															{member.user.name}
														</p>
														<p className="truncate text-muted-foreground text-xs">
															{member.user.email}
														</p>
													</div>
												</Link>
											</TableCell>
											<TableCell>
												<Badge variant={roleBadgeVariant(member.role)}>{member.role}</Badge>
											</TableCell>
											<TableCell className="text-right text-muted-foreground">
												{new Date(member.createdAt).toLocaleDateString("de-DE")}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardFrame>
				</div>
				</>
			) : null}

			<AddMemberDialog onOpenChange={setAddOpen} open={addOpen} organizationId={orgId} />
		</div>
	);
}

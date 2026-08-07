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
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { GroupDialog, type GroupRow } from "@/components/dashboard/groups/group-dialog";
import { GroupsCard } from "@/components/dashboard/groups/groups-card";
import { groupsQueryOptions } from "@/queries/groups";

export const Route = createFileRoute("/dashboard/groups")({
	loader: ({ context }) => {
		void context.queryClient.prefetchQuery(groupsQueryOptions());
	},
	pendingComponent: GroupsPageSkeleton,
	component: RouteComponent,
});

function GroupsPageSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Gruppen</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Organisiere deine Mitglieder in Gruppen.
					</p>
				</div>
				<Button disabled>
					<PlusIcon />
					Gruppe hinzufügen
				</Button>
			</div>

			<div className="flex flex-col gap-4">
				<Skeleton className="h-9 w-64" />
				<CardFrame className="w-full min-w-0 overflow-hidden">
					<Table className="min-w-[640px]" variant="card">
						<TableHeader>
							<TableRow>
								<TableHead>Gruppe</TableHead>
								<TableHead>Beschreibung</TableHead>
								<TableHead>Standardbeitrag</TableHead>
								<TableHead>Erstellt</TableHead>
								<TableHead className="w-px text-right">Aktionen</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array.from({ length: 5 }).map((_, index) => (
								<TableRow key={index}>
									<TableCell>
										<div className="flex items-center gap-3">
											<Skeleton className="size-3 rounded-full" />
											<Skeleton className="h-4 w-28" />
										</div>
									</TableCell>
									<TableCell><Skeleton className="h-4 w-40" /></TableCell>
									<TableCell><Skeleton className="h-4 w-16" /></TableCell>
									<TableCell><Skeleton className="h-4 w-20" /></TableCell>
									<TableCell />
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardFrame>
			</div>
		</div>
	);
}

function RouteComponent() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<GroupRow | null>(null);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Gruppen</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Organisiere deine Mitglieder in Gruppen.
					</p>
				</div>
				<Button
					onClick={() => {
						setEditing(null);
						setDialogOpen(true);
					}}
				>
					<PlusIcon />
					Gruppe hinzufügen
				</Button>
			</div>

			<GroupsCard
				onEdit={(group) => {
					setEditing(group);
					setDialogOpen(true);
				}}
			/>

			<GroupDialog group={editing} onOpenChange={setDialogOpen} open={dialogOpen} />
		</div>
	);
}

import { Button } from "@matdesk/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { GroupDialog, type GroupRow } from "@/components/dashboard/groups/group-dialog";
import { GroupsCard } from "@/components/dashboard/groups/groups-card";

export const Route = createFileRoute("/dashboard/groups")({
	component: RouteComponent,
});

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

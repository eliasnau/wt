import { Button } from "@matdesk/ui/components/button";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { MembersCard } from "@/components/dashboard/members/members-card";
import { groupsQueryOptions } from "@/queries/groups";
import { membersListQueryOptions } from "@/queries/members";

export const Route = createFileRoute("/dashboard/members/")({
	loader: ({ context }) => {
		void context.queryClient.prefetchQuery(groupsQueryOptions());
		void context.queryClient.prefetchQuery(
			membersListQueryOptions({
					page: 1,
					limit: 20,
					statuses: ["active", "cancelled_but_active"],
					sort: { field: "createdAt", direction: "desc" },
			}),
		);
	},
	pendingComponent: () => <Skeleton className="h-96 rounded-2xl" />,
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Mitglieder</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Verwalte die Mitglieder deiner Organisation.
					</p>
				</div>
				<Button render={<Link to="/dashboard/members/new" />}>
					<PlusIcon />
					Mitglied hinzufügen
				</Button>
			</div>

			<MembersCard />
		</div>
	);
}

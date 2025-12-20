"use client"
import {
	Header,
	HeaderContent,
	HeaderTitle,
	HeaderDescription,
	HeaderActions,
} from "../_components/page-header";
import GroupTable from "./_components/group-table";
import { NewGroupSheet } from "./_components/new-group-sheet";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

export default function GroupsPage() {
	const {
		data: groups = [],
		isPending,
		error,
		refetch,
	} = useQuery(orpc.groups.list.queryOptions());

	return (
		<div className="flex flex-col gap-8">							
			<Header>
				<HeaderContent>
					<HeaderTitle>Groups</HeaderTitle>
					<HeaderDescription>
						Manage member groups and permissions
					</HeaderDescription>
				</HeaderContent>
			<HeaderActions>
				<NewGroupSheet onGroupCreated={() => refetch()} />
			</HeaderActions>
			</Header>
			
			{error ? (
				<div className="rounded-md border border-red-500 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
					<AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
					<div>
						<div className="font-semibold mb-1">Error</div>
						<div>
							Failed to load groups. {error instanceof Error ? error.message : "Please try again later."}
						</div>
					</div>
				</div>
			) : (
				<GroupTable data={groups} loading={isPending} />
			)}
		</div>
	);
}

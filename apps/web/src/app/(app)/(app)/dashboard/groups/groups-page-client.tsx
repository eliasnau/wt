"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import { orpc } from "@/utils/orpc";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../_components/page-header";
import GroupTable from "./_components/group-table";
import { NewGroupSheet } from "./_components/new-group-sheet";

export function GroupsPageClient() {
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
					<HeaderTitle>Gruppen</HeaderTitle>
					<HeaderDescription>
						Manage member groups and permissions
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<NewGroupSheet onGroupCreated={() => refetch()} />
				</HeaderActions>
			</Header>

			{error ? (
				<Frame>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>Gruppen konnten nicht geladen werden</EmptyTitle>
								<EmptyDescription>
									{error instanceof Error
										? error.message
										: "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => refetch()}>Erneut versuchen</Button>
							</EmptyContent>
						</Empty>
					</FramePanel>
				</Frame>
			) : (
				<GroupTable data={groups} loading={isPending} onRefetch={refetch} />
			)}
		</div>
	);
}

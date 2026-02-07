"use client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from "nuqs";
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
import { CreateMemberButton } from "./_components/create-member-button";
import MembersTable from "./_components/members-table";
import { Suspense, useState } from "react";

export default function MembersPage() {
	return <Suspense><MembersPageContent /></Suspense>
}

export function MembersPageContent() {
	const [{ page, limit, search, groupIds }, setPagination] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		limit: parseAsInteger.withDefault(20),
		search: parseAsString.withDefault(""),
		groupIds: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const [includeCancelled, setIncludeCancelled] = useState(false);

	const UUID_REGEX =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

	const validGroupIds =
		groupIds.length > 0
			? groupIds.filter(
					(id) => id && id.trim().length > 0 && UUID_REGEX.test(id),
				)
			: [];

	const { data, isPending, error, refetch } = useQuery(
		orpc.members.list.queryOptions({
			input: {
				page,
				limit,
				search: search || undefined,
				groupIds: validGroupIds.length > 0 ? validGroupIds : undefined,
				includeCancelled,
			},
		}),
	);

	const { data: groupsData } = useQuery(
		orpc.groups.list.queryOptions({
			input: {},
		}),
	);

	const handlePageChange = (newPage: number) => {
		setPagination({ page: newPage });
	};

	const handleLimitChange = (newLimit: number) => {
		setPagination({ page: 1, limit: newLimit });
	};

	const handleSearchChange = (newSearch: string) => {
		setPagination({ page: 1, search: newSearch });
	};

	const handleGroupFilterChange = (newGroupIds: string[]) => {
		// Filter out invalid UUIDs before setting state
		const validGroupIds = newGroupIds.filter(
			(id) => id && id.trim().length > 0 && UUID_REGEX.test(id),
		);
		setPagination({ page: 1, groupIds: validGroupIds });
	};

	const handleIncludeCancelledChange = (nextValue: boolean) => {
		setIncludeCancelled(nextValue);
		setPagination({ page: 1 });
	};

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Members</HeaderTitle>
					<HeaderDescription>
						Manage your club members and their information
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<CreateMemberButton />
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
								<EmptyTitle>Failed to load Members</EmptyTitle>
								<EmptyDescription>
									{error instanceof Error
										? error.message
										: "Something went wrong. Please try again."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => refetch()}>Try Again</Button>
							</EmptyContent>
						</Empty>
					</FramePanel>
				</Frame>
			) : (
				<MembersTable
					data={data?.data ?? []}
					pagination={
						data?.pagination ?? {
							page,
							limit,
							totalCount: 0,
							totalPages: 0,
							hasNextPage: false,
							hasPreviousPage: false,
						}
					}
					search={search}
					groupIds={groupIds}
					groups={groupsData ?? []}
					includeCancelled={includeCancelled}
					onSearchChange={handleSearchChange}
					onPageChange={handlePageChange}
					onLimitChange={handleLimitChange}
					onGroupFilterChange={handleGroupFilterChange}
					onIncludeCancelledChange={handleIncludeCancelledChange}
					loading={isPending}
				/>
			)}
		</div>
	);
}

"use client";

import { ORPCError } from "@orpc/client";
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

const MEMBER_STATUS_FILTERS = [
	"active",
	"cancelled",
	"cancelled_but_active",
] as const;
type MemberStatusFilter = (typeof MEMBER_STATUS_FILTERS)[number];

export function MembersPageClient() {
	const [{ page, limit, search, groupIds, memberStatus }, setPagination] =
		useQueryStates({
			page: parseAsInteger.withDefault(1),
			limit: parseAsInteger.withDefault(20),
			search: parseAsString.withDefault(""),
			groupIds: parseAsArrayOf(parseAsString).withDefault([]),
			memberStatus: parseAsString.withDefault("active"),
		});

	const UUID_REGEX =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

	const validGroupIds =
		groupIds.length > 0
			? groupIds.filter(
					(id) => id && id.trim().length > 0 && UUID_REGEX.test(id),
				)
			: [];

	const resolvedMemberStatus: MemberStatusFilter =
		MEMBER_STATUS_FILTERS.includes(memberStatus as MemberStatusFilter)
			? (memberStatus as MemberStatusFilter)
			: "active";

	const { data, isPending, error, refetch } = useQuery(
		orpc.members.list.queryOptions({
			input: {
				page,
				limit,
				search: search || undefined,
				groupIds: validGroupIds.length > 0 ? validGroupIds : undefined,
				options: { memberStatus: resolvedMemberStatus },
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
		const validGroupIds = newGroupIds.filter(
			(id) => id && id.trim().length > 0 && UUID_REGEX.test(id),
		);
		setPagination({ page: 1, groupIds: validGroupIds });
	};

	const handleStatusFilterChange = (nextValue: MemberStatusFilter) => {
		setPagination({
			page: 1,
			memberStatus: nextValue,
		});
	};

	const isNoPermissionError = (() => {
		if (!error) return false;

		if (error instanceof ORPCError) {
			if (error.code === "FORBIDDEN") return true;
		}

		return false;
	})();

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Mitglieder</HeaderTitle>
					<HeaderDescription>
						Verwalte deine Vereinsmitglieder und ihre Informationen
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
								<EmptyTitle>
									{isNoPermissionError
										? "Kein Zugriff auf Mitglieder"
										: "Mitglieder konnten nicht geladen werden"}
								</EmptyTitle>
								<EmptyDescription>
									{isNoPermissionError
										? "Du hast nicht die nötigen Berechtigungen, um Mitglieder anzusehen."
										: error instanceof Error
											? error.message
											: "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								{isNoPermissionError ? (
									<Button onClick={() => window.history.back()}>Zurück</Button>
								) : (
									<Button onClick={() => refetch()}>Erneut versuchen</Button>
								)}
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
					memberStatus={resolvedMemberStatus}
					onSearchChange={handleSearchChange}
					onPageChange={handlePageChange}
					onLimitChange={handleLimitChange}
					onGroupFilterChange={handleGroupFilterChange}
					onStatusFilterChange={handleStatusFilterChange}
					loading={isPending}
				/>
			)}
		</div>
	);
}

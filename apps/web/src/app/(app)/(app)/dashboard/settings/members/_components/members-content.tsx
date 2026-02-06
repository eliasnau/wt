"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RouteIcon, Ban } from "lucide-react";
import { authClient } from "@repo/auth/client";
import {
	Empty,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
	EmptyHeader,
	EmptyContent,
} from "@/components/ui/empty";
import { useQuery } from "@tanstack/react-query";
import { MembersSection } from "./members-section";
import { InvitationsSection } from "./invitations-section";
import { RolesPermissionsSection } from "./roles-permissions-section";

export function MembersContent() {
	const { data: activeOrg } = authClient.useActiveOrganization();

	const { isPending, error, refetch } = useQuery({
		queryKey: ["organization-members", activeOrg?.id],
		retry: 1,
		queryFn: async () => {
			const result = await authClient.organization.listMembers({
				query: { limit: 10 },
			});

			if (result.error) {
				throw new Error(result.error.message || "Failed to load members");
			}

			return result.data;
		},
		enabled: !!activeOrg,
	});

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!activeOrg) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<RouteIcon />
					</EmptyMedia>
					<EmptyTitle>No active Organization</EmptyTitle>
					<EmptyDescription>
						Select an Organization to view Members
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button onClick={() => refetch()} className="mt-4">
						Try Again
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	if (error) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Ban />
					</EmptyMedia>
					<EmptyTitle>Failed to Load Members</EmptyTitle>
					<EmptyDescription>{error.message}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button onClick={() => refetch()} className="mt-4">
						Try Again
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<MembersSection />
			<InvitationsSection />
			<RolesPermissionsSection />
		</div>
	);
}

"use client";

import { authClient } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";
import { Ban, Loader2, RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { InvitationsSection } from "./invitations-section";
import { MembersSection } from "./members-section";
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
				throw new Error(
					result.error.message || "Mitglieder konnten nicht geladen werden",
				);
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
					<EmptyTitle>Keine aktive Organisation</EmptyTitle>
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
					<EmptyTitle>Mitglieder konnten nicht geladen werden</EmptyTitle>
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

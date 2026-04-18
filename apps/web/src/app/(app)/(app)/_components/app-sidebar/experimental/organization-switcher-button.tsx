"use client";

import { ChevronsUpDown } from "lucide-react";
import { authClient } from "@repo/auth/client";
import { OrganizationAvatar } from "@/components/organization-avatar";
import { openOrganizationSwitcher } from "@/components/organization-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

type Organization = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
};

export function OrganizationSwitcherButton() {
	const { session } = useAuth();
	const { data: organizationsData, isPending: isOrganizationsPending } =
		authClient.useListOrganizations();
	const { isPending: isSessionPending } = authClient.useSession();
	const organizations = organizationsData as Organization[] | undefined;
	const activeOrgId = session?.session?.activeOrganizationId;
	const activeOrg = organizations?.find((org) => org.id === activeOrgId);

	if (isSessionPending || isOrganizationsPending) {
		return (
			<div className="flex h-8 w-full items-center gap-2 rounded-md px-2">
				<Skeleton className="size-5 rounded-md" />
				<Skeleton className="h-3 w-24 rounded" />
			</div>
		);
	}

	if (!activeOrg) {
		return null;
	}

	return (
		<SidebarMenu className="w-full">
			<SidebarMenuItem>
				<SidebarMenuButton onClick={() => openOrganizationSwitcher()}>
					<OrganizationAvatar
						className="size-5 rounded-md"
						id={activeOrg.id}
						logo={activeOrg.logo}
						name={activeOrg.name}
					/>
					<span>{activeOrg.name}</span>
					<ChevronsUpDown className="ml-auto text-muted-foreground/60" />
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

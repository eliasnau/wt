"use client";

import { authClient } from "@repo/auth/client";
import { Building2, ChevronsUpDown, Plus } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrganizationAvatar } from "@/components/organization-avatar";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

type Organization = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	createdAt: Date | string;
	members?: unknown[];
};

export const OrganizationSelector = () => {
	const { isMobile } = useSidebar();
	const router = useRouter();
	const { session, switchOrganization } = useAuth();
	const { data: organizationsData } = authClient.useListOrganizations();
	const organizations = organizationsData as Organization[] | undefined;

	const activeOrgId = session?.session?.activeOrganizationId;
	const activeOrg = organizations?.find((org) => org.id === activeOrgId);

	const handleSelectOrg = async (orgId: string) => {
		try {
			await switchOrganization(orgId, "sidebar_dropdown");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Organisation konnte nicht gewechselt werden",
			);
		}
	};

	if (!activeOrg) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						onClick={() => router.push("/account/organizations" as Route)}
					>
						<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							<Building2 className="size-4" />
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">Keine Organisation</span>
							<span className="truncate text-muted-foreground text-xs">
								Select an organization
							</span>
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="default"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<OrganizationAvatar
								id={activeOrg.id}
								name={activeOrg.name}
								logo={activeOrg.logo}
								className="size-6"
							/>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate text-primary">{activeOrg.name}</span>
							</div>
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="flex items-center justify-between text-muted-foreground text-xs">
							<span>Organisationen</span>
							<span className="font-normal opacity-70">⌘⇧O</span>
						</DropdownMenuLabel>
						{organizations?.map((org) => {
							const isActive = org.id === activeOrgId;
							return (
								<DropdownMenuItem
									key={org.id}
									onClick={() => handleSelectOrg(org.id)}
									className="gap-2 p-2"
								>
									<OrganizationAvatar
										id={org.id}
										name={org.name}
										logo={org.logo}
										className="size-6 border"
									/>
									<span className="flex-1">{org.name}</span>
									{isActive && (
										<Badge variant="secondary" className="text-xs">
											Active
										</Badge>
									)}
								</DropdownMenuItem>
							);
						})}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="gap-2 p-2"
							onClick={() => router.push("/account/organizations" as Route)}
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<Plus className="size-4" />
							</div>
							<div className="font-medium text-muted-foreground">
								Create organization
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

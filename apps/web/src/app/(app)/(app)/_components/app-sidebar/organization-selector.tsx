"use client";

import { authClient } from "@repo/auth/client";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type Organization = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	createdAt: Date | string;
	members?: unknown[];
};

export const OrganizationSelector = () => {
	const { isMobile, state } = useSidebar();
	const isCollapsed = state === "collapsed";
	const router = useRouter();
	const { session, switchOrganization } = useAuth();
	const { data: organizationsData, isPending: isOrganizationsPending } =
		authClient.useListOrganizations();
	const { isPending: isSessionPending } = authClient.useSession();
	const organizations = organizationsData as Organization[] | undefined;

	const activeOrgId = session?.session?.activeOrganizationId;
	const activeOrg = organizations?.find((org) => org.id === activeOrgId);

	if (isSessionPending || isOrganizationsPending) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="default" disabled className="h-9">
						<Skeleton className="size-6 shrink-0 rounded-md" />
						{!isCollapsed && (
							<div className="flex flex-1 flex-col gap-1 text-left">
								<Skeleton className="h-3.5 w-28 rounded" />
							</div>
						)}
						{!isCollapsed && (
							<Skeleton className="size-4 shrink-0 rounded-sm" />
						)}
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

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
						size="default"
						className="h-9"
						onClick={() => router.push("/account/organizations" as Route)}
					>
						<div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-sidebar-border/60 bg-sidebar-accent">
							<Building2 className="size-3.5 text-muted-foreground" />
						</div>
						{!isCollapsed && (
							<div className="flex flex-1 flex-col text-left">
								<span className="truncate font-medium text-muted-foreground text-sm">
									Keine Organisation
								</span>
							</div>
						)}
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
							className={cn(
								"h-9 transition-colors data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
								isCollapsed && "justify-center px-0",
							)}
						>
							<OrganizationAvatar
								id={activeOrg.id}
								name={activeOrg.name}
								logo={activeOrg.logo}
								className="size-6 shrink-0 rounded-md"
							/>
							{!isCollapsed && (
								<>
									<div className="flex min-w-0 flex-1 flex-col text-left">
										<span className="truncate font-semibold text-sm leading-tight">
											{activeOrg.name}
										</span>
									</div>
									<ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/60" />
								</>
							)}
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-52 rounded-xl p-1 shadow-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={6}
					>
						<DropdownMenuLabel className="px-2 py-1 font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
							Organisationen
						</DropdownMenuLabel>
						{organizations?.map((org) => {
							const isActive = org.id === activeOrgId;
							return (
								<DropdownMenuItem
									key={org.id}
									onClick={() => handleSelectOrg(org.id)}
									className="flex items-center gap-2 rounded-lg px-2 py-1.5"
								>
									<OrganizationAvatar
										id={org.id}
										name={org.name}
										logo={org.logo}
										className="size-5 rounded-md border border-border/40"
									/>
									<span className="flex-1 text-sm">{org.name}</span>
									{isActive && (
										<Check className="size-3.5 text-foreground/60" />
									)}
								</DropdownMenuItem>
							);
						})}
						<DropdownMenuSeparator className="my-1" />
						<DropdownMenuItem
							className="flex items-center gap-2 rounded-lg px-2 py-1.5"
							onClick={() => router.push("/account/organizations" as Route)}
						>
							<div className="flex size-5 items-center justify-center rounded-md border border-border/60 border-dashed">
								<Plus className="size-3 text-muted-foreground" />
							</div>
							<span className="text-muted-foreground text-sm">
								Organisation erstellen
							</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

"use client";

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
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Plus, Settings, Building2 } from "lucide-react";
import { authClient } from "@repo/auth/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const OrganizationSelector = () => {
	const { isMobile } = useSidebar();
	const router = useRouter();
	const { data: organizations } = authClient.useListOrganizations();
	const { data: session } = authClient.useSession();

	const activeOrgId = session?.session?.activeOrganizationId;
	const activeOrg = organizations?.find((org) => org.id === activeOrgId);

	const handleSelectOrg = async (orgId: string) => {
		try {
			const { error } = await authClient.organization.setActive({
				organizationId: orgId,
			});

			if (error) {
				toast.error(error.message || "Failed to switch organization");
				return;
			}

			toast.success("Organization switched");
			router.push("/dashboard");
		} catch (error) {
			toast.error("Failed to switch organization");
			console.error(error);
		}
	};

	if (!activeOrg) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						onClick={() => router.push("/account/organizations")}
					>
						<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							<Building2 className="size-4" />
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">No Organization</span>
							<span className="truncate text-xs text-muted-foreground">
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
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								{activeOrg.logo ? (
									<img
										src={activeOrg.logo}
										alt={activeOrg.name}
										className="size-8 rounded-lg object-cover"
									/>
								) : (
									<span className="text-lg font-semibold">
										{activeOrg.name.charAt(0).toUpperCase()}
									</span>
								)}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">
									{activeOrg.name}
								</span>
								<span className="truncate text-xs">
									{activeOrg.members?.length || 0}{" "}
									{activeOrg.members?.length === 1 ? "member" : "members"}
								</span>
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
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Organizations
						</DropdownMenuLabel>
						{organizations?.map((org) => {
							const isActive = org.id === activeOrgId;
							return (
								<DropdownMenuItem
									key={org.id}
									onClick={() => handleSelectOrg(org.id)}
									className="gap-2 p-2"
								>
									<div className="flex size-6 items-center justify-center rounded-sm border">
										{org.logo ? (
											<img
												src={org.logo}
												alt={org.name}
												className="size-6 rounded-sm object-cover"
											/>
										) : (
											<span className="text-xs font-semibold">
												{org.name.charAt(0).toUpperCase()}
											</span>
										)}
									</div>
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
							onClick={() => router.push("/account/organizations")}
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<Plus className="size-4" />
							</div>
							<div className="font-medium text-muted-foreground">
								Create organization
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="gap-2 p-2"
							onClick={() => router.push("/account/organizations")}
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<Settings className="size-4" />
							</div>
							<div className="font-medium text-muted-foreground">
								Manage organizations
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

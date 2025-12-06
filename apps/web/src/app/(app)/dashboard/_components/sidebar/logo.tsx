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
import { useClerk, useOrganization, useOrganizationList, useUser } from "@clerk/nextjs";
import { ChevronsUpDown, Plus, Settings } from "lucide-react";
import * as React from "react";

export const Logo = () => {
	const { isMobile } = useSidebar();
	const { organization } = useOrganization();
	const { setActive, userMemberships } = useOrganizationList({
		userMemberships: {
			infinite: true,
		},
	});
	const { openOrganizationProfile } = useClerk();
	const { openCreateOrganization } = useClerk();

	if (!organization) return null;

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
								{organization.imageUrl ? (
									<img
										src={organization.imageUrl}
										alt={organization.name}
										className="size-8 rounded-lg"
									/>
								) : (
									<span className="text-lg font-semibold">
										{organization.name.charAt(0).toUpperCase()}
									</span>
								)}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">
									{organization.name}
								</span>
								<span className="truncate text-xs">
									{organization.membersCount}{" "}
									{organization.membersCount === 1 ? "member" : "members"}
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
						{userMemberships.data?.map((mem) => (
							<DropdownMenuItem
								key={mem.organization.id}
								onClick={() =>
									setActive?.({ organization: mem.organization.id })
								}
								className="gap-2 p-2"
							>
								<div className="flex size-6 items-center justify-center rounded-sm border">
									{mem.organization.imageUrl ? (
										<img
											src={mem.organization.imageUrl}
											alt={mem.organization.name}
											className="size-6 rounded-sm"
										/>
									) : (
										<span className="text-xs font-semibold">
											{mem.organization.name.charAt(0).toUpperCase()}
										</span>
									)}
								</div>
								{mem.organization.name}
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem className="gap-2 p-2" onClick={() => openCreateOrganization()}>
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<Plus className="size-4" />
							</div>
							<div className="font-medium text-muted-foreground">
								Create organization
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem className="gap-2 p-2" onClick={() => openOrganizationProfile()}>
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<Settings className="size-4" />
							</div>
							<div className="font-medium text-muted-foreground">
								Manage organization
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

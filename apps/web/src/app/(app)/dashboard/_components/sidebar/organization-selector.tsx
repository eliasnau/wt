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
import { ChevronsUpDown, Plus, Settings } from "lucide-react";
import * as React from "react";

type Organization = {
	id: string;
	name: string;
	imageUrl?: string;
	membersCount: number;
};

const mockOrganizations: Organization[] = [
	{
		id: "1",
		name: "Acme",
		imageUrl: undefined,
		membersCount: 12,
	},
	{
		id: "2",
		name: "Acme 2",
		imageUrl: undefined,
		membersCount: 8,
	},
];

export const OrganizationSelector = () => {
	const { isMobile } = useSidebar();
	const [activeOrg, setActiveOrg] = React.useState<Organization>(mockOrganizations[0]);

	if (!activeOrg) return null;

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
								{activeOrg.imageUrl ? (
									<img
										src={activeOrg.imageUrl}
										alt={activeOrg.name}
										className="size-8 rounded-lg"
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
									{activeOrg.membersCount}{" "}
									{activeOrg.membersCount === 1 ? "member" : "members"}
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
						{mockOrganizations.map((org) => (
							<DropdownMenuItem
								key={org.id}
								onClick={() => setActiveOrg(org)}
								className="gap-2 p-2"
							>
								<div className="flex size-6 items-center justify-center rounded-sm border">
									{org.imageUrl ? (
										<img
											src={org.imageUrl}
											alt={org.name}
											className="size-6 rounded-sm"
										/>
									) : (
										<span className="text-xs font-semibold">
											{org.name.charAt(0).toUpperCase()}
										</span>
									)}
								</div>
								{org.name}
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem className="gap-2 p-2">
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<Plus className="size-4" />
							</div>
							<div className="font-medium text-muted-foreground">
								Create organization
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem className="gap-2 p-2">
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

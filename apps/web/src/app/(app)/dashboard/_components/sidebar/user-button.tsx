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
import { useClerk, useUser } from "@clerk/nextjs";
import {
	ChevronsUpDown,
	LogOut,
	Settings,
	User,
	Bell,
	CreditCard,
} from "lucide-react";
import * as React from "react";

export const UserButton = () => {
	const { isMobile } = useSidebar();
	const { user } = useUser();
	const { signOut, openUserProfile } = useClerk();

	if (!user) return null;

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
								{user.imageUrl ? (
									<img
										src={user.imageUrl}
										alt={user.fullName || user.username || "User"}
										className="size-8 rounded-lg"
									/>
								) : (
									<User className="size-4" />
								)}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">
									{user.fullName || user.username || "User"}
								</span>
								<span className="truncate text-xs">
									{user.primaryEmailAddress?.emailAddress}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg mb-4"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Account
						</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() => openUserProfile()}
							className="gap-2 p-2"
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<User className="size-4" />
							</div>
							<div className="font-medium">Account</div>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => signOut()}
							className="gap-2 p-2 text-red-600 focus:text-red-600"
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<LogOut className="size-4 text-red-600" />
							</div>
							<div className="font-medium">Sign out</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuPortal,
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
	Moon,
	Sun,
	Monitor,
} from "lucide-react";
import * as React from "react";
import { useTheme } from "next-themes";

export const UserButton = () => {
	const { isMobile } = useSidebar();
	const { user } = useUser();
	const { signOut, openUserProfile } = useClerk();
	const { theme, setTheme } = useTheme();

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
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="gap-2 p-2">
								<div className="flex size-6 items-center justify-center rounded-md border bg-background">
									{theme === "light" ? (
										<Sun className="size-4" />
									) : theme === "dark" ? (
										<Moon className="size-4" />
									) : (
										<Monitor className="size-4" />
									)}
								</div>
								<div className="font-medium">Theme</div>
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<DropdownMenuItem
										onClick={() => setTheme("light")}
										className="gap-2"
									>
										<Sun className="size-4" />
										<span>Light</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setTheme("dark")}
										className="gap-2"
									>
										<Moon className="size-4" />
										<span>Dark</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setTheme("system")}
										className="gap-2"
									>
										<Monitor className="size-4" />
										<span>System</span>
									</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
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

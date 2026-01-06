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
import { authClient } from "@repo/auth/client";
import { ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { User } from "@/components/animate-ui/icons/user";
import { SunMoon } from "@/components/animate-ui/icons/sun-moon";
import { Sun } from "@/components/animate-ui/icons/sun";
import { Moon } from "@/components/animate-ui/icons/moon";
import { LogOut } from "@/components/animate-ui/icons/log-out";
import posthog from "posthog-js";

export const UserButton = () => {
	const { isMobile } = useSidebar();
	const { data: session } = authClient.useSession();
	const router = useRouter();
	const { theme, setTheme } = useTheme();

	const handleSignOut = async () => {
		posthog.capture("auth:sign_out");
		posthog.reset();

		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/sign-in" as Route);
				},
				onError(context) {
					toast.error(context.error.message);
				},
			},
		});
	};

	if (!session?.user) return null;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									src={session.user.image || undefined}
									alt={session.user.name || "User"}
								/>
								<AvatarFallback className="rounded-lg">
									<User className="size-4" />
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">
									{session.user.name || "User"}
								</span>
								<span className="truncate text-xs">{session.user.email}</span>
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
						<AnimateIcon animateOnHover>
							<DropdownMenuLabel className="text-xs text-muted-foreground">
								Account
							</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={() => router.push("/account" as Route)}
								className="gap-2 p-2"
							>
								<div className="flex size-6 items-center justify-center rounded-md border bg-background">
									<User className="size-4" />
								</div>
								<div className="font-medium">Account</div>
							</DropdownMenuItem>
						</AnimateIcon>
						<DropdownMenuSub>
							<AnimateIcon animateOnHover>
								<DropdownMenuSubTrigger className="gap-2 p-2">
									<div className="flex size-6 items-center justify-center rounded-md border bg-background">
										<SunMoon className="size-4" />
									</div>
									<div className="font-medium">Theme</div>
								</DropdownMenuSubTrigger>
							</AnimateIcon>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<AnimateIcon animateOnHover>
										<DropdownMenuItem
											onClick={() => setTheme("light")}
											className="gap-2"
										>
											<Sun className="size-4" />
											<span>Light</span>
										</DropdownMenuItem>
									</AnimateIcon>
									<AnimateIcon animateOnHover>
										<DropdownMenuItem
											onClick={() => setTheme("dark")}
											className="gap-2"
										>
											<Moon className="size-4" />
											<span>Dark</span>
										</DropdownMenuItem>
									</AnimateIcon>
									<AnimateIcon animateOnHover>
										<DropdownMenuItem
											onClick={() => setTheme("system")}
											className="gap-2"
										>
											<SunMoon className="size-4" />
											<span>System</span>
										</DropdownMenuItem>
									</AnimateIcon>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
						<DropdownMenuSeparator />
						<AnimateIcon animateOnHover>
							<DropdownMenuItem
								onClick={handleSignOut}
								className="gap-2 p-2 text-red-600 focus:text-red-600"
							>
								<div className="flex size-6 items-center justify-center rounded-md border bg-background">
									<LogOut className="size-4 text-red-600" />
								</div>
								<div className="font-medium">Sign out</div>
							</DropdownMenuItem>
						</AnimateIcon>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

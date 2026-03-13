"use client";

import { authClient } from "@repo/auth/client";
import { ChevronsUpDown } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import posthog from "posthog-js";
import { toast } from "sonner";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { LogOut } from "@/components/animate-ui/icons/log-out";
import { Moon } from "@/components/animate-ui/icons/moon";
import { Sun } from "@/components/animate-ui/icons/sun";
import { SunMoon } from "@/components/animate-ui/icons/sun-moon";
import { User } from "@/components/animate-ui/icons/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Menu,
	MenuGroup,
	MenuGroupLabel,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuShortcut,
	MenuSub,
	MenuSubPopup,
	MenuSubTrigger,
	MenuTrigger,
} from "@/components/ui/menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const UserButton = () => {
	const { isMobile, state } = useSidebar();
	const isCollapsed = state === "collapsed";
	const { session } = useAuth();
	const { isPending: isSessionPending } = authClient.useSession();
	const router = useRouter();
	const { setTheme } = useTheme();
	const hideSensitiveInformatoin = Boolean(
		session?.user?.hideSensitiveInformatoin,
	);
	const displayName = session?.user?.name ?? "User";

	const handleSignOut = async () => {
		posthog.capture("auth:sign-out");
		posthog.reset();

		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/sign-in" as Route);
				},
				onError(context: { error: { message: string } }) {
					toast.error(context.error.message);
				},
			},
		});
	};

	if (isSessionPending) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="default" disabled className="h-9">
						<Skeleton className="size-6 shrink-0 rounded-full" />
						{!isCollapsed && (
							<div className="flex flex-1 flex-col gap-1">
								<Skeleton className="h-3.5 w-24 rounded" />
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

	if (!session?.user) return null;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<Menu>
					<MenuTrigger
						className="w-full"
						render={
							<SidebarMenuButton
								size="default"
								className={cn(
									"h-9 transition-colors data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
									isCollapsed && "justify-center px-0",
								)}
							/>
						}
					>
						<Avatar className="size-6 shrink-0 rounded-full ring-1 ring-border/40">
							<AvatarImage
								className={cn(
									hideSensitiveInformatoin &&
										"pointer-events-none select-none blur-[4px]",
								)}
								src={
									session.user.image ||
									`https://avatar.vercel.sh/${session.user.id}` ||
									undefined
								}
								alt={session.user.name || "User"}
							/>
							<AvatarFallback className="rounded-full bg-sidebar-accent">
								<Skeleton className="size-6 rounded-full" />
							</AvatarFallback>
						</Avatar>
						{!isCollapsed && (
							<>
								<div className="flex min-w-0 flex-1 flex-col text-left">
									<span
										className={cn(
											"truncate font-semibold text-sm leading-tight",
											hideSensitiveInformatoin &&
												"select-none tracking-[0.02em] opacity-90 blur-[4px]",
										)}
									>
										{displayName}
									</span>
								</div>
								<ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/60" />
							</>
						)}
					</MenuTrigger>
					<MenuPopup align="end" side={isMobile ? "top" : "right"}>
						<MenuGroup>
							<MenuGroupLabel>Konto</MenuGroupLabel>
							<AnimateIcon animateOnHover>
								<MenuItem onClick={() => router.push("/account" as Route)}>
									<User />
									<span>Konto</span>
								</MenuItem>
							</AnimateIcon>
						</MenuGroup>

						<MenuSub>
							<AnimateIcon animateOnHover>
								<MenuSubTrigger>
									<SunMoon />
									<span>Design</span>
									<MenuShortcut>⌘D</MenuShortcut>
								</MenuSubTrigger>
							</AnimateIcon>
							<MenuSubPopup>
								<AnimateIcon animateOnHover>
									<MenuItem onClick={() => setTheme("light")} className="gap-2">
										<Sun className="size-4" />
										<span>Hell</span>
									</MenuItem>
								</AnimateIcon>
								<AnimateIcon animateOnHover>
									<MenuItem onClick={() => setTheme("dark")} className="gap-2">
										<Moon className="size-4" />
										<span>Dunkel</span>
									</MenuItem>
								</AnimateIcon>
								<AnimateIcon animateOnHover>
									<MenuItem
										onClick={() => setTheme("system")}
										className="gap-2"
									>
										<SunMoon className="size-4" />
										<span>System</span>
									</MenuItem>
								</AnimateIcon>
							</MenuSubPopup>
						</MenuSub>
						<MenuSeparator />

						<AnimateIcon animateOnHover>
							<MenuItem
								onClick={handleSignOut}
								className="gap-2 text-red-600 focus:text-red-600"
							>
								<LogOut className="size-4" />
								<span>Abmelden</span>
							</MenuItem>
						</AnimateIcon>
					</MenuPopup>
				</Menu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

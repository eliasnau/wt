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
	const { isMobile } = useSidebar();
	const { session } = useAuth();
	const { isPending: isSessionPending } = authClient.useSession();
	const router = useRouter();
	const { setTheme } = useTheme();
	const hideSensitiveInformatoin = Boolean(
		session?.user?.hideSensitiveInformatoin,
	);
	const displayName = session?.user?.name ?? "User";

	const handleSignOut = async () => {
		posthog.capture("auth:abmelden");
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

	if (isSessionPending) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="default" disabled>
						<Skeleton className="h-6 w-6 rounded-full" />
						<div className="grid flex-1 text-left text-sm leading-tight">
							<Skeleton className="h-4 w-24 rounded-md" />
						</div>
						<Skeleton className="h-4 w-4 rounded-sm" />
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
						className={"w-full"}
						render={
							<SidebarMenuButton
								size="default"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							/>
						}
					>
						<Avatar className="h-6 w-6 rounded-full">
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
							<AvatarFallback className="rounded-lg">
								<Skeleton className="h-6 w-6 rounded-md" />
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span
								className={cn(
									"truncate font-semibold",
									hideSensitiveInformatoin &&
										"select-none text-foreground/75 tracking-[0.02em] opacity-90 blur-[4px]",
								)}
							>
								{displayName}
							</span>
						</div>
						<ChevronsUpDown className="ml-auto" />
					</MenuTrigger>
					<MenuPopup align={"end"} side={isMobile ? "top" : "right"}>
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

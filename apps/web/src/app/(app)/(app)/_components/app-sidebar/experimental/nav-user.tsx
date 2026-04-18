"use client";

import { authClient } from "@repo/auth/client";
import { env } from "@repo/env/web";
import { BookOpen, ChevronsUpDown } from "lucide-react";
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
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
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
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function NavUser() {
	const router = useRouter();
	const { session } = useAuth();
	const { isPending: isSessionPending } = authClient.useSession();
	const { setTheme } = useTheme();
	const { isMobile } = useSidebar();
	const user = session?.user;
	const docsUrl = env.NEXT_PUBLIC_MATDESK_DOCS_URL?.trim();

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
			<div className="flex h-8 items-center gap-2 rounded-md border border-transparent px-2">
				<Skeleton className="size-6 rounded-full" />
				<Skeleton className="hidden h-3 w-24 rounded md:block" />
				<Skeleton className="ml-auto hidden size-3.5 rounded-sm md:block" />
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<Menu>
			<MenuTrigger
				className="w-full"
				render={
					<button
						type="button"
						className={cn(
							"flex h-8 items-center gap-2 rounded-md border border-transparent px-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
							"data-[state=open]:bg-sidebar-accent data-[state=open]:text-foreground",
						)}
					/>
				}
			>
					<Avatar className="size-6 shrink-0">
						<AvatarImage
							alt={user.name || "User"}
							src={user.image || `https://avatar.vercel.sh/${user.id}`}
						/>
						<AvatarFallback>{(user.name || "U").charAt(0)}</AvatarFallback>
					</Avatar>
					<span className="hidden max-w-32 truncate text-sm md:inline">
						{user.name || "User"}
					</span>
					<ChevronsUpDown className="hidden size-3.5 shrink-0 text-muted-foreground/60 md:block" />
			</MenuTrigger>
			<MenuPopup align="end" className="w-60" side={isMobile ? "top" : "bottom"}>
				<MenuGroup>
					<MenuGroupLabel>Konto</MenuGroupLabel>
					<AnimateIcon animateOnHover>
						<MenuItem onClick={() => router.push("/account" as Route)}>
							<User />
							<span>Konto</span>
						</MenuItem>
					</AnimateIcon>
					{docsUrl ? (
						<AnimateIcon animateOnHover>
							<MenuItem
								onClick={() =>
									window.open(docsUrl, "_blank", "noopener,noreferrer")
								}
							>
								<BookOpen className="size-4" />
								<span>Dokumentation</span>
							</MenuItem>
						</AnimateIcon>
					) : null}
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
							<MenuItem onClick={() => setTheme("light")}>
								<Sun className="size-4" />
								<span>Hell</span>
							</MenuItem>
						</AnimateIcon>
						<AnimateIcon animateOnHover>
							<MenuItem onClick={() => setTheme("dark")}>
								<Moon className="size-4" />
								<span>Dunkel</span>
							</MenuItem>
						</AnimateIcon>
						<AnimateIcon animateOnHover>
							<MenuItem onClick={() => setTheme("system")}>
								<SunMoon className="size-4" />
								<span>System</span>
							</MenuItem>
						</AnimateIcon>
					</MenuSubPopup>
				</MenuSub>
				<MenuSeparator />
				<AnimateIcon animateOnHover>
					<MenuItem
						className="text-red-600 focus:text-red-600"
						onClick={handleSignOut}
					>
						<LogOut className="size-4" />
						<span>Abmelden</span>
					</MenuItem>
				</AnimateIcon>
			</MenuPopup>
		</Menu>
	);
}

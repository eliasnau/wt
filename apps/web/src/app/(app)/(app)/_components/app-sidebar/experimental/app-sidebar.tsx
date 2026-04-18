"use client";

import type { Route } from "next";
import Link from "next/link";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAppShellNavigation } from "./app-shared";
import { LatestChange } from "./latest-change";
import { NavGroup } from "./nav-group";
import { OrganizationSwitcherButton } from "./organization-switcher-button";

export function ExperimentalAppSidebar() {
	const { footerNavLinks, navGroups } = useAppShellNavigation();

	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
				"**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75",
			)}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-14 justify-center border-b px-2 py-0">
				<OrganizationSwitcherButton />
			</SidebarHeader>
			<SidebarContent>
				{navGroups.map((group, index) => (
					<NavGroup key={`sidebar-group-${index}`} {...group} />
				))}
			</SidebarContent>
			<SidebarFooter className="gap-0 p-0">
				<LatestChange />
				<SidebarMenu className="border-t p-2">
					{footerNavLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<AnimateIcon animateOnHover asChild>
								<SidebarMenuButton
									asChild
									className="text-muted-foreground"
									isActive={item.isActive}
									size="sm"
								>
									<Link href={(item.path ?? "/dashboard") as Route}>
										{item.icon}
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</AnimateIcon>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

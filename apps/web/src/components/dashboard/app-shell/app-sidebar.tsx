"use client";

import { cn } from "@matdesk/ui/lib/utils";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@matdesk/ui/components/sidebar";

import { OrgSwitcher } from "@/components/auth/org-switcher";
import { LatestChange } from "@/components/dashboard/app-shell/latest-change";
import { NavMain } from "@/components/dashboard/app-shell/nav-main";

export function AppSidebar() {
	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
				"**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
			)}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-14 justify-center border-b px-2">
				<OrgSwitcher />
			</SidebarHeader>
			<SidebarContent>
				<NavMain />
			</SidebarContent>
			<SidebarFooter className="gap-0 p-0">
				<LatestChange />
				<div className="px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
					<p className="text-nowrap text-[9px] text-muted-foreground">
						© {new Date().getFullYear()} Matdesk
					</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}

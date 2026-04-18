"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { SidebarFooter } from "./footer";
import { SidebarHeader } from "./header";
import { MobileSidebarTrigger } from "./mobile-sidebar-trigger";
import { SidebarRail } from "./sidebar-rail";
import { SidebarSectionContent } from "./sidebar-section-content";

export function LegacyAppSidebar() {
	return (
		<>
			<Sidebar
				collapsible="icon"
				className="group/app-sidebar border-sidebar-border/50 border-r"
			>
				<div className="relative flex h-full flex-col">
					<SidebarHeader />
					<SidebarSectionContent />
					<SidebarFooter />
					<SidebarRail />
				</div>
			</Sidebar>
			<MobileSidebarTrigger />
		</>
	);
}

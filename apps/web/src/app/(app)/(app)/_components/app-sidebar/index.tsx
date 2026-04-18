"use client";

import { ExperimentalAppShell, ExperimentalAppSidebar } from "./experimental";
import { LegacyAppSidebar } from "./legacy";
import { SidebarStyleProvider, useSidebarStyle } from "./sidebar-style-context";
import { SidebarStyleToggle } from "./sidebar-style-toggle";

function AppSidebarInner() {
	const { style } = useSidebarStyle();

	return style === "experimental" ? (
		<ExperimentalAppSidebar />
	) : (
		<LegacyAppSidebar />
	);
}

export function AppSidebar() {
	return <AppSidebarInner />;
}

export {
	ExperimentalAppShell,
	LegacyAppSidebar,
	SidebarStyleProvider,
	SidebarStyleToggle,
	useSidebarStyle,
};

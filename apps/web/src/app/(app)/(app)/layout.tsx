"use client";

import { OrganizationSwitcher } from "@/components/organization-switcher";
import { TopLoader } from "@/components/top-loader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
	ExperimentalAppShell,
	LegacyAppSidebar,
	SidebarStyleProvider,
	SidebarStyleToggle,
	useSidebarStyle,
} from "./_components/app-sidebar";

function LegacyLayoutFrame({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<div className="relative flex h-screen w-full overflow-hidden">
				<LegacyAppSidebar />
				<SidebarInset className="flex flex-col">
					<div className="pointer-events-none fixed right-4 bottom-4 z-[70]">
						<SidebarStyleToggle className="pointer-events-auto" />
					</div>

					<main className="flex-1 overflow-y-auto overflow-x-hidden">
						<div className="mx-auto w-full max-w-full overflow-x-hidden p-4 sm:p-6 md:max-w-3xl md:max-w-[45rem] lg:max-w-7xl lg:p-10">
							{children}
						</div>
					</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}

function ExperimentalLayoutFrame({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex h-screen w-full overflow-hidden">
			<div className="pointer-events-none fixed right-4 bottom-4 z-[70]">
				<SidebarStyleToggle className="pointer-events-auto" />
			</div>
			<div className="flex min-h-0 flex-1">
				<ExperimentalAppShell>{children}</ExperimentalAppShell>
			</div>
		</div>
	);
}

function LayoutFrame({ children }: { children: React.ReactNode }) {
	const { style } = useSidebarStyle();

	return style === "experimental" ? (
		<ExperimentalLayoutFrame>{children}</ExperimentalLayoutFrame>
	) : (
		<LegacyLayoutFrame>{children}</LegacyLayoutFrame>
	);
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<TopLoader />
			<SidebarStyleProvider>
				<LayoutFrame>{children}</LayoutFrame>
			</SidebarStyleProvider>
			<OrganizationSwitcher />
			<style>{`
        html,
        body {
          overscroll-behavior: none;
        }
      `}</style>
		</>
	);
}

"use client";

import { Separator } from "@matdesk/ui/components/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@matdesk/ui/components/sidebar";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import UserMenu from "@/components/auth/user-menu";

export function AdminShell({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AdminSidebar />
			<SidebarInset>
				<header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:px-6">
					<div className="flex items-center gap-3">
						<SidebarTrigger />
						<Separator
							className="h-4 data-[orientation=vertical]:self-center"
							orientation="vertical"
						/>
						<span className="font-medium text-sm">Platform Admin</span>
					</div>
					<UserMenu />
				</header>
				<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

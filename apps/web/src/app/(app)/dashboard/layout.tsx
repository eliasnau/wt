import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./_components/sidebar/app-sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<div className="relative flex h-screen w-full">
				<DashboardSidebar />
				<SidebarInset className="flex flex-col">
					<main className="flex-1 overflow-auto">
						<div className="container mx-auto max-w-7xl p-8 lg:p-12">
							{children}
						</div>
					</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}

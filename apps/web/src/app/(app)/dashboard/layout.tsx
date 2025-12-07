import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
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
					<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
						<SidebarTrigger />
						<Separator orientation="vertical" className="h-4" />
					</header>

					<main className="flex-1 overflow-auto">
						<div className="mx-auto w-full p-4 sm:p-6 lg:p-10 max-w-screen lg:max-w-7xl md:max-w-3xl md:max-w-[45rem]">
							{children}
						</div>
					</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}

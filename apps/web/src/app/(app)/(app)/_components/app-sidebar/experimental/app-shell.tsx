import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AppHeader } from "./app-header";
import { ExperimentalAppSidebar } from "./app-sidebar";

export function ExperimentalAppShell({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider className={cn("h-full min-h-0 [--app-wrapper-max-width:80rem]")}>
			<ExperimentalAppSidebar />
			<SidebarInset className="flex min-h-0 flex-col">
				<AppHeader />
				<main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
					<div
						className={cn(
							"mx-auto w-full max-w-(--app-wrapper-max-width) flex flex-1 flex-col p-4 md:p-6",
						)}
					>
						{children}
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

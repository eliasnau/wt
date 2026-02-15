import { ChevronLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";
import { AccountSidebar } from "./account";
import { DashboardLayout } from "./dashboard";
import { SidebarFooter } from "./footer";
// import { AccountLayout } from './account'
import { SidebarHeader } from "./header";
import { MobileSidebarTrigger } from "./mobile-sidebar-trigger";

function EdgeCollapseButton({
	isSidebarHovered,
}: {
	isSidebarHovered: boolean;
}) {
	const { state, toggleSidebar } = useSidebar();
	const isExpanded = state === "expanded";

	if (!isExpanded) return null;

	return (
		<AnimatePresence>
			{isSidebarHovered && (
				<motion.div
					initial={{ opacity: 0, scale: 0.78 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.78 }}
					transition={{ duration: 0.12, ease: "easeOut" }}
					className="absolute top-1/2 -right-3 z-20 hidden origin-center -translate-y-1/2 md:block"
				>
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleSidebar}
						className="size-7 rounded-full border border-sidebar-border/70 bg-sidebar text-muted-foreground shadow-sm transition-colors hover:bg-sidebar-muted/80 hover:text-foreground"
						aria-label="Collapse sidebar"
					>
						<ChevronLeft className="size-4" />
					</Button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export function AppSidebar() {
	const pathname = usePathname();
	const [isSidebarHovered, setIsSidebarHovered] = useState(false);

	let Content = null;
	if (pathname?.startsWith("/dashboard")) {
		Content = <DashboardLayout />;
	} else if (pathname?.startsWith("/account")) {
		Content = <AccountSidebar />;
	} else {
		Content = null;
	}

	return (
		<>
			<Sidebar
				collapsible="icon"
				className="group/app-sidebar"
				onMouseEnter={() => setIsSidebarHovered(true)}
				onMouseLeave={() => setIsSidebarHovered(false)}
			>
				<div className="relative flex h-full flex-col">
					<SidebarHeader />
					{Content}
					<SidebarFooter />
					<EdgeCollapseButton isSidebarHovered={isSidebarHovered} />
				</div>
			</Sidebar>
			<MobileSidebarTrigger />
		</>
	);
}

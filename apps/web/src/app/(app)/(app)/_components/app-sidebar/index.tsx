import { ChevronLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
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
	const [transitionDirection, setTransitionDirection] = useState(1);
	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

	let section: "dashboard" | "account" | "other" = "other";
	let Content = null;
	if (pathname?.startsWith("/dashboard")) {
		section = "dashboard";
		Content = <DashboardLayout />;
	} else if (pathname?.startsWith("/account")) {
		section = "account";
		Content = <AccountSidebar />;
	}

	const [prevSection, setPrevSection] = useState<
		"dashboard" | "account" | "other"
	>(section);

	if (prevSection !== section) {
		if (prevSection === "dashboard" && section === "account") {
			setTransitionDirection(1);
		} else if (prevSection === "account" && section === "dashboard") {
			setTransitionDirection(-1);
		}
		setPrevSection(section);
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
					<div className="relative min-h-0 flex-1 overflow-hidden">
						<motion.div
							key={section}
							initial={
								mounted
									? {
											opacity: 0,
											x: transitionDirection * 10,
											filter: "blur(2.5px)",
										}
									: false
							}
							animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
							transition={{ duration: 0.09, ease: "easeOut" }}
							className="absolute inset-0"
						>
							{Content}
						</motion.div>
					</div>
					<SidebarFooter />
					<EdgeCollapseButton isSidebarHovered={isSidebarHovered} />
				</div>
			</Sidebar>
			<MobileSidebarTrigger />
		</>
	);
}

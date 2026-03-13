"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { AccountSidebar } from "./account";
import { DashboardLayout } from "./dashboard";
import { SidebarFooter } from "./footer";
import { SidebarHeader } from "./header";
import { MobileSidebarTrigger } from "./mobile-sidebar-trigger";
import { SidebarRail } from "./sidebar-rail";

export function AppSidebar() {
	const pathname = usePathname();
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
				className="group/app-sidebar border-sidebar-border/50 border-r"
			>
				<div className="relative flex h-full flex-col">
					<SidebarHeader />
					<div className="relative min-h-0 flex-1 overflow-hidden">
						<AnimatePresence mode="wait" initial={false}>
							<motion.div
								key={section}
								initial={
									mounted
										? {
												opacity: 0,
												x: transitionDirection * 8,
												filter: "blur(2px)",
											}
										: false
								}
								animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
								exit={{
									opacity: 0,
									x: transitionDirection * -8,
									filter: "blur(2px)",
								}}
								transition={{ duration: 0.1, ease: "easeOut" }}
								className="absolute inset-0"
							>
								{Content}
							</motion.div>
						</AnimatePresence>
					</div>
					<SidebarFooter />
					<SidebarRail />
				</div>
			</Sidebar>
			<MobileSidebarTrigger />
		</>
	);
}

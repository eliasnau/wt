"use client";

import { haptic } from "ios-haptics";
import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Menu } from "@/components/animate-ui/icons/menu";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileSidebarTrigger() {
	const { toggleSidebar, openMobile } = useSidebar();
	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

	const content = (
		<div className="fixed right-6 bottom-6 z-[100] md:hidden">
			<AnimatePresence>
				{!openMobile && (
					<motion.div
						initial={{ opacity: 0, y: 10, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 10, scale: 0.96 }}
						transition={{ duration: 0.16, ease: "easeOut" }}
					>
						<AnimateIcon animate={openMobile}>
							<Button
								data-sidebar="trigger"
								data-slot="sidebar-trigger"
								size="icon-lg"
								variant="outline"
								className="bg-background shadow-lg dark:bg-sidebar"
								onClick={() => {
									haptic();
									toggleSidebar();
								}}
							>
								<Menu />
							</Button>
						</AnimateIcon>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);

	return mounted ? createPortal(content, document.body) : null;
}

"use client";

import { haptic } from "ios-haptics";
import { Plus } from "lucide-react";
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
				{openMobile && (
					<motion.div
						initial={{ opacity: 0, y: 0 }}
						animate={{ opacity: 1, y: -50 }}
						exit={{ opacity: 0, y: 0 }}
						className="absolute right-0 bottom-0 -z-10"
					>
						<Button
							size="icon-lg"
							variant="secondary"
							onClick={() => {
								haptic();
							}}
						>
							<Plus />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimateIcon animate={openMobile}>
				<Button
					data-sidebar="trigger"
					data-slot="sidebar-trigger"
					size="icon-lg"
					variant="secondary"
					onClick={() => {
						haptic();
						toggleSidebar();
					}}
				>
					<Menu />
				</Button>
			</AnimateIcon>
		</div>
	);

	return mounted ? createPortal(content, document.body) : null;
}

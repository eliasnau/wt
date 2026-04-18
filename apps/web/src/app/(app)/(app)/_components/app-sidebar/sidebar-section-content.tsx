"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { AccountSidebar } from "./account";
import { DashboardLayout } from "./dashboard";

type SidebarSection = "account" | "dashboard" | "other";

export function SidebarSectionContent({
	className,
}: {
	className?: string;
}) {
	const pathname = usePathname();
	const [transitionDirection, setTransitionDirection] = useState(1);
	const [prevSection, setPrevSection] = useState<SidebarSection>("other");
	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

	const { content, section } = useMemo(() => {
		if (pathname?.startsWith("/dashboard")) {
			return {
				content: <DashboardLayout />,
				section: "dashboard" as SidebarSection,
			};
		}

		if (pathname?.startsWith("/account")) {
			return {
				content: <AccountSidebar />,
				section: "account" as SidebarSection,
			};
		}

		return {
			content: null,
			section: "other" as SidebarSection,
		};
	}, [pathname]);

	useEffect(() => {
		if (prevSection === section) {
			return;
		}

		if (prevSection === "dashboard" && section === "account") {
			setTransitionDirection(1);
		} else if (prevSection === "account" && section === "dashboard") {
			setTransitionDirection(-1);
		}

		setPrevSection(section);
	}, [prevSection, section]);

	return (
		<div className={cn("relative min-h-0 flex-1 overflow-hidden", className)}>
			<AnimatePresence mode="wait" initial={false}>
				<motion.div
					key={section}
					animate={{ filter: "blur(0px)", opacity: 1, x: 0 }}
					className="absolute inset-0"
					exit={{
						filter: "blur(2px)",
						opacity: 0,
						x: transitionDirection * -8,
					}}
					initial={
						mounted
							? {
									filter: "blur(2px)",
									opacity: 0,
									x: transitionDirection * 8,
								}
							: false
					}
					transition={{ duration: 0.1, ease: "easeOut" }}
				>
					{content}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

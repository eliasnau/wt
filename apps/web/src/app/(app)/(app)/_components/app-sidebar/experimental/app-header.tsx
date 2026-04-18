"use client";

import { DecorIcon } from "@/components/ui/decor-icon";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AppBreadcrumbs } from "./app-breadcrumbs";
import { useAppShellNavigation } from "./app-shared";
import { CustomSidebarTrigger } from "./custom-sidebar-trigger";
import { NavUser } from "./nav-user";
import { SearchCommand } from "./search-command";

export function AppHeader() {
	const { navLinks } = useAppShellNavigation();
	const activeItem = navLinks.find((item) => item.isActive);

	return (
		<header
			className={cn(
				"relative z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 md:px-6",
			)}
		>
			<DecorIcon className="hidden md:block" position="bottom-left" />
			<div className="flex min-w-0 items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<div className="hidden md:block">
					<AppBreadcrumbs page={activeItem} />
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-2 md:gap-3">
				<SearchCommand />
				<Separator
					className="hidden h-4 data-[orientation=vertical]:self-center md:block"
					orientation="vertical"
				/>
				<NavUser />
			</div>
		</header>
	);
}

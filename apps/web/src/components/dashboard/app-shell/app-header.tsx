import { cn } from "@matdesk/ui/lib/utils";
import { Button } from "@matdesk/ui/components/button";
import { Separator } from "@matdesk/ui/components/separator";
import { DecorIcon } from "@/components/dashboard/app-shell/decor-icon";
import { AppBreadcrumbs } from "@/components/dashboard/app-shell/app-breadcrumbs";
import { navLinks } from "@/components/dashboard/app-shell/app-shared";
import { CustomSidebarTrigger } from "@/components/dashboard/app-shell/custom-sidebar-trigger";
import UserMenu from "@/components/auth/user-menu";
import { useLocation } from "@tanstack/react-router";
import { SendIcon, BellIcon } from "lucide-react";

export function AppHeader() {
	const pathname = useLocation().pathname;
	const activeItem = [...navLinks]
		.sort((a, b) => b.path.length - a.path.length)
		.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
				"bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
			)}
		>
			<DecorIcon className="hidden md:block" position="bottom-left" />
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={activeItem} />
			</div>
			<div className="flex items-center gap-3">
				<Button size="icon-sm" variant="outline">
					<SendIcon
					/>
				</Button>
				<Button aria-label="Notifications" size="icon-sm" variant="outline">
					<BellIcon
					/>
				</Button>
				<Separator
					className="h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<UserMenu />
			</div>
		</header>
	);
}

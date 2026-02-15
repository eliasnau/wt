import { SidebarFooter as SidebarFooterPrimitive } from "@/components/ui/sidebar";
import { UserButton } from "./user-button";

export function SidebarFooter() {
	return (
		<SidebarFooterPrimitive className="border-sidebar-border/60 border-t px-2 py-2">
			<UserButton />
		</SidebarFooterPrimitive>
	);
}

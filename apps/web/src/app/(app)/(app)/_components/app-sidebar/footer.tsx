import { SidebarFooter as SidebarFooterPrimitive } from "@/components/ui/sidebar";
import { UserButton } from "./user-button";

export function SidebarFooter() {
	return (
		<SidebarFooterPrimitive className="px-2 py-2">
			<UserButton />
		</SidebarFooterPrimitive>
	);
}

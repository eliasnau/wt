import { SidebarHeader as SidebarHeaderPrimitive } from "@/components/ui/sidebar";
import { OrganizationSelector } from "./organization-selector";

export function SidebarHeader() {
	return (
		<SidebarHeaderPrimitive className="px-2 pt-4 pb-0">
			<OrganizationSelector />
		</SidebarHeaderPrimitive>
	);
}

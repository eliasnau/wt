import {
  SidebarHeader as SidebarHeaderPrimitive,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { OrganizationSelector } from "./organization-selector";

export function SidebarHeader() {
  const { state } = useSidebar();

  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeaderPrimitive
      className={cn(
        "relative flex px-2 pb-2 md:pt-3.5",
        isCollapsed
          ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-center md:justify-start"
          : "flex-row items-center justify-between",
      )}
    >
      <OrganizationSelector />

      {isCollapsed && (
        <SidebarTrigger className="hidden rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-muted/70 hover:text-foreground md:block" />
      )}
    </SidebarHeaderPrimitive>
  );
}

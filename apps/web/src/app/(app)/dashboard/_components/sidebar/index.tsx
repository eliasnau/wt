import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/app/(app)/dashboard/_components/sidebar/app-sidebar";

export default function Sidebar02() {
  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col" />
      </div>
    </SidebarProvider>
  );
}

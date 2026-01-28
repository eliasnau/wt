"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./_components/app-sidebar";
import { TopLoader } from "@/components/top-loader";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { authClient } from "@repo/auth/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: activeOrg, isPending } = authClient.useActiveOrganization();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <TopLoader />
      <SidebarProvider>
        <div className="relative flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            {/* <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
            </header> */}

            <main className="flex-1 overflow-auto">
              <div className="mx-auto w-full p-4 sm:p-6 lg:p-10 max-w-screen lg:max-w-7xl md:max-w-3xl md:max-w-[45rem]">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <OrganizationSwitcher />
      <style jsx global>{`
        html,
        body {
          overscroll-behavior: none;
        }
      `}</style>
    </>
  );
}

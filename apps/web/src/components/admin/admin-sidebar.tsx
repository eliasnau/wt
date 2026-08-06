"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@matdesk/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeftIcon, Building2Icon, ScrollTextIcon, UsersIcon } from "lucide-react";

import { LogoIcon } from "@/components/logo";

const NAV = [
  { title: "Organisationen", path: "/admin/organizations" as const, icon: <Building2Icon /> },
  { title: "Benutzer", path: "/admin/users" as const, icon: <UsersIcon /> },
  { title: "Audit Log", path: "/admin/audit-log" as const, icon: <ScrollTextIcon /> },
];

export function AdminSidebar() {
  const pathname = useLocation().pathname;

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-14 justify-center border-b px-3">
        <div className="flex items-center gap-2">
          <LogoIcon className="size-5 shrink-0" />
          <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">
            Matdesk Admin
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.path)}
                  render={<Link to={item.path} />}
                  tooltip={item.title}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-muted-foreground"
              render={<Link to="/dashboard" />}
              tooltip="Zur App"
            >
              <ArrowLeftIcon />
              <span>Zur App</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@matdesk/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeftIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";

import { Logo } from "@/components/logo";

const navigation = [
  { title: "Profil", path: "/account/profile" as const, icon: <UserRoundIcon /> },
  { title: "Sicherheit", path: "/account/security" as const, icon: <ShieldCheckIcon /> },
];

export function AccountSidebar() {
  const pathname = useLocation().pathname;

  return (
    <Sidebar
      className="*:data-[slot=sidebar-inner]:bg-background **:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-14 justify-center border-b px-3">
        <Link className="flex items-center" to="/dashboard">
          <Logo className="h-4.5 w-auto group-data-[collapsible=icon]:hidden" />
          <span className="hidden size-7 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground group-data-[collapsible=icon]:flex">
            M
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Konto</SidebarGroupLabel>
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={pathname === item.path}
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
              tooltip="Zurück zum Dashboard"
            >
              <ArrowLeftIcon />
              <span>Zurück zum Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

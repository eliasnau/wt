"use client";

import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@matdesk/ui/components/menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@matdesk/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@matdesk/ui/components/sidebar";
import { cn } from "@matdesk/ui/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";

import { type NavItem, navGroups } from "@/components/dashboard/app-shell/app-shared";

type IsActive = (path: string, exact?: boolean) => boolean;

export function NavMain() {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useLocation().pathname;

  const isActive: IsActive = (path, exact) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <>
      {navGroups.map((group, index) => (
        <SidebarGroup key={group.label ?? `group-${index}`}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarMenu>
            {group.items.map((item) =>
              item.subItems?.length ? (
                <NavCollapsible
                  key={item.title}
                  collapsed={collapsed}
                  isActive={isActive}
                  item={item}
                />
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.path, item.exact)}
                    render={<Link to={item.path} />}
                    tooltip={item.title}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-full bg-primary/12 px-1.5 py-0.5 font-medium text-[10px] text-primary leading-none">
                        {item.badge}
                      </span>
                    ) : null}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}

function NavCollapsible({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: IsActive;
}) {
  const subItems = item.subItems ?? [];
  const parentOpen = isActive(item.path);

  // Collapsed sidebar: clicking the icon opens a menu to pick a sub-item.
  if (collapsed) {
    return (
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={
              <SidebarMenuButton
                className="cursor-pointer"
                isActive={false}
              />
            }
          >
            {item.icon}
            <span>{item.title}</span>
          </MenuTrigger>
          <MenuPopup align="start" side="right" sideOffset={8} className="min-w-44">
            {subItems.map((sub) => (
              <MenuItem
                key={sub.title}
                className={cn(isActive(sub.path, sub.exact) && "bg-accent text-accent-foreground")}
                render={<Link to={sub.path} />}
              >
                {sub.icon}
                {sub.title}
              </MenuItem>
            ))}
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    );
  }

  // Expanded sidebar: collapsible sub-menu.
  return (
    <Collapsible
      className="group/collapsible"
      defaultOpen={parentOpen}
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            className="cursor-pointer"
            isActive={false}
          />
        }
      >
        {item.icon}
        <span>{item.title}</span>
        <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {subItems.map((sub) => (
            <SidebarMenuSubItem key={sub.title}>
              <SidebarMenuSubButton
                isActive={isActive(sub.path, sub.exact)}
                render={<Link to={sub.path} />}
              >
                {sub.icon}
                <span>{sub.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

"use client";

import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@repo/auth/client";
import * as React from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import posthog from "posthog-js";
import { SunMoon } from "@/components/animate-ui/icons/sun-moon";
import { User } from "@/components/animate-ui/icons/user";
import { ChevronsUpDown } from "lucide-react";
import { Moon } from "@/components/animate-ui/icons/moon";
import { Sun } from "@/components/animate-ui/icons/sun";
import { LogOut } from "@/components/animate-ui/icons/log-out";

export const UserButton = () => {
  const { isMobile } = useSidebar();
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    posthog.capture("auth:sign_out");
    posthog.reset();

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in" as Route);
        },
        onError(context) {
          toast.error(context.error.message);
        },
      },
    });
  };

  if (!session?.user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger className={"w-full"}>
            <SidebarMenuButton
              size="default"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-6 w-6 rounded-full">
                <AvatarImage
                  src={
                    session.user.image ||
                    `https://avatar.vercel.sh/${session.user.id}` ||
                    undefined
                  }
                  alt={session.user.name || "User"}
                />
                <AvatarFallback className="rounded-lg">
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {session.user.name || "User"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </MenuTrigger>
          <MenuPopup align={"end"} side={isMobile ? "top": "right"}>
            <MenuGroup>
              <MenuGroupLabel>Konto</MenuGroupLabel>
              <AnimateIcon animateOnHover>
                <MenuItem
                  onClick={() => router.push("/account" as Route)}
                >
                  <User />
                  <span>Konto</span>
                </MenuItem>
              </AnimateIcon>
            </MenuGroup>

            <MenuSub>
              <AnimateIcon animateOnHover>
                <MenuSubTrigger>
                  <SunMoon />
                  <span>Design</span>
                </MenuSubTrigger>
              </AnimateIcon>
              <MenuSubPopup>
                <AnimateIcon animateOnHover>
                  <MenuItem
                    onClick={() => setTheme("light")}
                    className="gap-2"
                  >
                    <Sun className="size-4" />
                    <span>Hell</span>
                  </MenuItem>
                </AnimateIcon>
                <AnimateIcon animateOnHover>
                  <MenuItem
                    onClick={() => setTheme("dark")}
                    className="gap-2"
                  >
                    <Moon className="size-4" />
                    <span>Dunkel</span>
                  </MenuItem>
                </AnimateIcon>
                <AnimateIcon animateOnHover>
                  <MenuItem
                    onClick={() => setTheme("system")}
                    className="gap-2"
                  >
                    <SunMoon className="size-4" />
                    <span>System</span>
                  </MenuItem>
                </AnimateIcon>
              </MenuSubPopup>
            </MenuSub>

            <MenuSeparator />

            <AnimateIcon animateOnHover>
              <MenuItem
                onClick={handleSignOut}
                className="gap-2 text-red-600 focus:text-red-600"
              >
                <LogOut className="size-4" />
                <span>Abmelden</span>
              </MenuItem>
            </AnimateIcon>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

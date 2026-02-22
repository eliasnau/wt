"use client";

import { authClient } from "@repo/auth/client";
import { LogOutIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@repo/auth";

type UserAccountMenuProps = {
  user?: User;
  className?: string;
};

export function UserAccountMenu({ user, className }: UserAccountMenuProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const hideSensitiveInformatoin = user?.hideSensitiveInformatoin;
  const displayName = user?.name ?? "Account";

  const handleSignOut = async () => {
    try {
      // await signOut();
      console.log(user);
    } catch (error: any) {
      toast.error(error?.message || "Failed to sign out");
    }
  };

  if (!user) {
    return (
      <div className={cn("flex items-center rounded-md px-2 py-1", className)}>
        <Avatar className="h-6 w-6 rounded-full">
          <AvatarFallback className="rounded-lg">
            <Skeleton className="h-6 w-6 rounded-md" />
          </AvatarFallback>
        </Avatar>
        <Skeleton className="ml-1 h-4 w-20 rounded" />
      </div>
    );
  }

  return (
    <Menu>
      <MenuTrigger
        className={cn(
          "flex cursor-pointer items-center rounded-md px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        render={<Button variant="ghost" />}
      >
        <Avatar className="h-6 w-6 rounded-full">
          <AvatarImage
            className={cn(
              hideSensitiveInformatoin &&
                "pointer-events-none select-none blur-[4px]",
            )}
            src={
              user?.image || `https://avatar.vercel.sh/${user?.id}` || undefined
            }
            alt={user?.name || "User"}
          />
          <AvatarFallback className="rounded-lg">
            <Skeleton className="h-6 w-6 rounded-md" />
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "ml-1",
            hideSensitiveInformatoin &&
              "select-none text-foreground/75 tracking-[0.02em] opacity-90 blur-[4px]",
          )}
        >
          {displayName}
        </span>
      </MenuTrigger>
      <MenuPopup align="end" sideOffset={8}>
        <MenuItem className="gap-2" onClick={() => router.push("/account")}>
          <UserIcon className="size-4" />
          <span>Manage account</span>
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOutIcon className="size-4" />
          <span>Logout</span>
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}

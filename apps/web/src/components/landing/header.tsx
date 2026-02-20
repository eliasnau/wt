"use client";

import { authClient } from "@repo/auth/client";
import { LayoutDashboardIcon, LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { MobileNav } from "@/components/landing/mobile-nav";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import type { getServerSession } from "@/lib/auth";
import { Kbd, KbdGroup } from "../ui/kbd";

export const navLinks = [
  {
    label: "Features",
    href: "#features",
  },
  {
    label: "Pricing",
    href: "#pricing",
  },
  {
    label: "About",
    href: "#about",
  },
];

interface HeaderProps {
  className?: string;
  session?: Awaited<ReturnType<typeof getServerSession>>;
}

export function Header({ className, session }: HeaderProps) {
  const scrolled = useScroll(10);
  const isSignedIn = !!session?.user;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
        {
          "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-4xl md:shadow":
            scrolled,
        },
        className,
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
          {
            "md:px-2": scrolled,
          },
        )}
      >
        <Link
          className="rounded-md p-2 hover:bg-muted dark:hover:bg-muted/50"
          href="/"
        >
          <Logo className="h-4" />
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          <div>
            {navLinks.map((link) => (
              <Button
                key={link.label}
                size="sm"
                variant="ghost"
                render={<a href={link.href} />}
              >
                {link.label}
              </Button>
            ))}
          </div>
          {isSignedIn && session.user ? (
            <div className="flex items-center gap-2">
              <Link href={"/dashboard" as Route}>
                <Button variant="default" size="sm">
                  Dashboard
                </Button>
              </Link>
              <UserMenu user={session.user} />
            </div>
          ) : (
            <>
              <Link href={"/sign-in" as Route}>
                <Button size="sm" variant="outline">
                  Anmelden
                </Button>
              </Link>
              <Link href={"/sign-up" as Route}>
                <Button size="sm">Registrieren</Button>
              </Link>
            </>
          )}
        </div>
        <MobileNav session={session} />
      </nav>
    </header>
  );
}

function UserMenu({
  user,
}: {
  user: { id: string; name: string | null; image?: string | null };
}) {
  const router = useRouter();

  const handleSignOut = async () => {
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

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <Menu>
      <MenuTrigger
        className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        render={<button type="button" />}
      >
        <Avatar className="size-7">
          <AvatarImage
            src={
              user.image || `https://avatar.vercel.sh/${user.id}` || undefined
            }
            alt={user.name || "User"}
          />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </MenuTrigger>
      <MenuPopup align="end" sideOffset={8}>
        <MenuItem
          className="gap-2"
          onClick={() => router.push("/dashboard" as Route)}
        >
          <LayoutDashboardIcon className="size-4" />
          <span>Dashboard</span>
        </MenuItem>
        <MenuItem
          className="gap-2"
          onClick={() => router.push("/account" as Route)}
        >
          <UserIcon className="size-4" />
          <span>Konto</span>
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOutIcon className="size-4" />
          <span>Abmelden</span>
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}

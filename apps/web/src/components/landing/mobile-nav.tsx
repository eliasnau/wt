import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";
import { Portal, PortalBackdrop } from "@/components/ui/portal";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/components/landing/header";
import type { getServerSession } from "@/lib/auth";

interface MobileNavProps {
  session?: Awaited<ReturnType<typeof getServerSession>>;
}

export function MobileNav({ session }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const isSignedIn = !!session?.user;

  return (
    <div className="md:hidden">
      <Button
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label="Toggle menu"
        className="md:hidden"
        onClick={() => setOpen(!open)}
        size="icon"
        variant="outline"
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none"
          fill="none"
          height={16}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={16}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="-translate-y-[7px] origin-center in-[[data-slot=button][aria-expanded=true]]:translate-x-0 in-[[data-slot=button][aria-expanded=true]]:translate-y-0 in-[[data-slot=button][aria-expanded=true]]:rotate-315 transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)]"
            d="M4 12L20 12"
          />
          <path
            className="origin-center in-[[data-slot=button][aria-expanded=true]]:rotate-45 transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)]"
            d="M4 12H20"
          />
          <path
            className="origin-center in-[[data-slot=button][aria-expanded=true]]:translate-y-0 translate-y-[7px] in-[[data-slot=button][aria-expanded=true]]:rotate-135 transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)]"
            d="M4 12H20"
          />
        </svg>
        {/*{open ? (
          <XIcon className="size-4.5" />
        ) : (
          <MenuIcon className="size-4.5" />
        )}*/}
      </Button>
      {open && (
        <Portal className="top-14" id="mobile-menu">
          <PortalBackdrop />
          <div
            className={cn(
              "data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
              "size-full p-4",
            )}
            data-slot={open ? "open" : "closed"}
          >
            <div className="grid gap-y-2">
              {navLinks.map((link) => (
                <Button
                  className="justify-start"
                  key={link.label}
                  variant="ghost"
                  render={<a href={link.href} />}
                >
                  {link.label}
                </Button>
              ))}
            </div>
            <div className="mt-12 flex flex-col gap-2">
              {isSignedIn ? (
                <Link href={"/dashboard" as Route}>
                  <Button className="w-full">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href={"/sign-in" as Route}>
                    <Button className="w-full" variant="outline">
                      Anmelden
                    </Button>
                  </Link>
                  <Link href={"/sign-up" as Route}>
                    <Button className="w-full">Registrieren</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

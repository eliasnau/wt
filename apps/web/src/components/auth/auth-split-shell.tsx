"use client";

import { Button } from "@matdesk/ui/components/button";
import { Link } from "@tanstack/react-router";
import { AlertCircleIcon, ChevronLeftIcon } from "lucide-react";
import type React from "react";

import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";

/**
 * Two-column shell shared by sign-in and sign-up: branded panel on the left
 * (hidden below `lg`), form column on the right. Children are rendered inside
 * the centered `max-w-sm` stack.
 */
export function AuthSplitShell({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <Logo className="mr-auto h-4.5" monochrome />

        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center px-8 py-10 lg:py-0">
        <div aria-hidden className="absolute inset-0 isolate -z-10 opacity-60 contain-strict">
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>

        <Button className="absolute top-7 left-5" render={<Link to="/" />} variant="ghost">
          <ChevronLeftIcon />
          Startseite
        </Button>

        <div className="mx-auto w-full max-w-sm space-y-4">
          <Logo className="h-4.5 lg:hidden" monochrome />
          {children}
        </div>
      </div>
    </main>
  );
}

/**
 * Shown when the user arrived from an organization invitation link (`?invite`),
 * where signing in with a different address silently drops the invitation.
 */
export function InvitationBanner(): React.ReactElement {
  return (
    <div className="rounded-lg border border-warning/35 bg-warning/6 px-3 py-2">
      <p className="flex items-start gap-2 text-muted-foreground text-xs leading-relaxed">
        <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0 text-warning" />
        <span>
          Melde dich mit derselben E-Mail-Adresse an oder erstelle damit ein Konto, an die du die
          Einladung erhalten hast. Falls du bereits ein Konto mit einer anderen E-Mail-Adresse hast,
          bitte den Organisations-Admin, die Einladung an diese Adresse zu senden.
        </span>
      </p>
    </div>
  );
}

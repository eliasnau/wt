import { Frame } from "@matdesk/ui/components/frame";
import { cn } from "@matdesk/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type React from "react";

/** Vertically centered wrapper for the single-card auth screens. */
export function AuthCardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

/** `Frame` with the raised-card treatment the auth screens use. */
export function AuthCard({
  className,
  ...props
}: React.ComponentProps<typeof Frame>): React.ReactElement {
  return (
    <Frame
      className={cn(
        "relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72",
        className,
      )}
      {...props}
    />
  );
}

export function BackToSignInLink(): React.ReactElement {
  return (
    <div className="mb-4">
      <Link
        className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
        to="/sign-in"
      >
        <ArrowLeftIcon className="size-4" />
        Zurück zur Anmeldung
      </Link>
    </div>
  );
}

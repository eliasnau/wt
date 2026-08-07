"use client";

import { Button } from "@matdesk/ui/components/button";
import { cn } from "@matdesk/ui/lib/utils";
import { SparklesIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

const LATEST_UPDATE = {
  id: "new-stuff-2026-07",
  title: "Entdecke neue Funktionen",
  description:
    "Plane Veranstaltungen und Einzelcoachings und bilde die Fortschritte deiner Mitglieder mit Graduierungen ab.",
} as const;

const LAST_DISMISSED_UPDATE_KEY = "matdesk:last-dismissed-update";

export function LatestChange() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(localStorage.getItem(LAST_DISMISSED_UPDATE_KEY) !== LATEST_UPDATE.id);
  }, []);

  function dismiss() {
    localStorage.setItem(LAST_DISMISSED_UPDATE_KEY, LATEST_UPDATE.id);
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "group/latest-change relative flex min-h-32 w-full flex-col gap-2 overflow-hidden border-t px-4 py-4",
        "transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0",
      )}
    >
      <div className="flex items-center gap-1.5 font-medium text-primary text-xs">
        <SparklesIcon className="size-3.5" />
        Neu
      </div>
      <p className="font-medium text-sm">{LATEST_UPDATE.title}</p>
      <p className="text-muted-foreground text-xs leading-relaxed">{LATEST_UPDATE.description}</p>
      <Button
        aria-label="Update ausblenden"
        className="absolute top-2 right-2 size-7 rounded-full opacity-0 transition-opacity group-hover/latest-change:opacity-100 focus-visible:opacity-100"
        onClick={dismiss}
        size="icon-sm"
        variant="ghost"
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}

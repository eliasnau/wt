"use client";

import { CompassIcon, HomeIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type NoPermissionProps = {
  title?: string;
  description?: string;
};

export function NoPermission({
  title = "Kein Zugriff",
  description = "Du hast nicht die nötigen Berechtigungen, um diesen Bereich anzusehen.",
}: NoPermissionProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <h2 className="font-semibold text-3xl tracking-tight">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button render={<Link href={"/dashboard" as Route} />}>
            <HomeIcon data-icon="inline-start" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            render={<Link href={"/account" as Route} />}
          >
            <CompassIcon data-icon="inline-start" />
            Konto
          </Button>
        </div>
      </div>
    </div>
  );
}

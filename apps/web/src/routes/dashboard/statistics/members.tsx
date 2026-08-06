import { createFileRoute } from "@tanstack/react-router";

import { MemberMap } from "@/components/dashboard/statistics/member-map";

export const Route = createFileRoute("/dashboard/statistics/members")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mitgliederkarte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Geografische Verteilung der Mitglieder nach Wohnort.
        </p>
      </div>

      <MemberMap />
    </div>
  );
}

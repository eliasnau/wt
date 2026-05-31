import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
      <p className="text-sm text-muted-foreground">Bald verfügbar.</p>
    </div>
  );
}

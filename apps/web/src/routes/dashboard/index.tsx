import { createFileRoute, getRouteApi } from "@tanstack/react-router";

const dashboardRoute = getRouteApi("/dashboard");

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = dashboardRoute.useRouteContext();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{session?.user.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's an overview of your workspace.
        </p>
      </div>
    </div>
  );
}

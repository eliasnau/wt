import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}

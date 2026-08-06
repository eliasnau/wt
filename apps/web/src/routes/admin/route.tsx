import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/admin")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUser();
		return { session };
	},
	loader: async ({ context, location }) => {
		if (!context.session) {
			throw redirect({ search: { redirectUrl: location.href }, to: "/sign-in" });
		}
		// Platform admins only (better-auth admin plugin role) — not org admins.
		// The server session user type is a union; the role lives on the admin branch.
		const role = (context.session.user as { role?: string | null }).role;
		if (role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
});

function RouteComponent() {
	return (
		<AdminShell>
			<Outlet />
		</AdminShell>
	);
}

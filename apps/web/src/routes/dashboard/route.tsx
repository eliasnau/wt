import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/components/dashboard/app-shell/app-shell";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context, location }) => {
    if (!context.session) {
      throw redirect({
        search: { redirectUrl: location.href },
        to: "/sign-in",
      });
    }

    const session = context.session.session;
    const activeOrganizationId =
      "activeOrganizationId" in session ? session.activeOrganizationId : null;

    if (!activeOrganizationId) {
      throw redirect({
        to: "/organizations",
        search: { redirect: location.href },
      });
    }
  },
});

function RouteComponent() {
  // Disable overscroll (rubber-band) while on the dashboard. The document is the
  // scroll container, so toggle it on <html> and restore on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overscrollBehavior;
    html.style.overscrollBehavior = "none";
    return () => {
      html.style.overscrollBehavior = previous;
    };
  }, []);

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

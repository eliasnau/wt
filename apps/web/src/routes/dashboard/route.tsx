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
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
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

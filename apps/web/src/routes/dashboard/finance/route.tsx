import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/finance")({
  component: FinanceLayout,
});

function FinanceLayout() {
  return <Outlet />;
}

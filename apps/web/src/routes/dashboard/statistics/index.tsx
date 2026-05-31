import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/statistics/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/statistics/timeline" });
  },
});

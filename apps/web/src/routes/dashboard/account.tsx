import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/account")({
  beforeLoad: () => {
    throw redirect({ to: "/account/profile" });
  },
});

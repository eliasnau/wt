import { createFileRoute, redirect } from "@tanstack/react-router";

import { sessionQueryOptions } from "@/functions/get-user";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    // No homepage yet. Signed-in users go straight to the dashboard — it bounces
    // on to /organizations itself when no organization is active.
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
    throw redirect({ to: session ? "/dashboard" : "/sign-in" });
  },
});

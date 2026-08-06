import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // No homepage yet — send everyone to sign-in. The _auth layout bounces
    // already-authenticated users on to /organizations.
    throw redirect({ to: "/sign-in" });
  },
});

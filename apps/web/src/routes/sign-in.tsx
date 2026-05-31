import { createFileRoute, useNavigate } from "@tanstack/react-router";

import SignInForm from "@/components/sign-in-form";

export const Route = createFileRoute("/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  return <SignInForm onSwitchToSignUp={() => navigate({ to: "/sign-up" })} />;
}

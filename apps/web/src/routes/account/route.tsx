import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AccountShell } from "@/components/account/account-shell";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/account")({
  component: AccountLayout,
  beforeLoad: async ({ location }) => {
    const session = await getUser();
    if (!session) {
      throw redirect({ search: { redirectUrl: location.href }, to: "/sign-in" });
    }
  },
});

function AccountLayout() {
  return (
    <AccountShell>
      <Outlet />
    </AccountShell>
  );
}

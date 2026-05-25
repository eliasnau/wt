import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";

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
  const { session } = Route.useRouteContext();

  const privateData = useQuery(orpc.privateData.queryOptions());

  return (
    <div>
      {session?.user.name}
      {privateData.data?.message}
    </div>
  );
}

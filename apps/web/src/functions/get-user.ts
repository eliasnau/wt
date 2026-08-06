import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";

export const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context.session;
  });

/**
 * Session as resolved on the server (reads the better-auth cookie cache, so no
 * DB hit on the hot path). Prefetched in the root loader and dehydrated to the
 * client, so the first paint already knows who's signed in — no loading flash.
 */
export const sessionQueryOptions = queryOptions({
  queryKey: ["session"],
  queryFn: () => getUser(),
  // Only needed to seed the first paint; better-auth's client store owns
  // reactivity afterwards, so there's no point re-fetching this on the client.
  staleTime: Infinity,
});

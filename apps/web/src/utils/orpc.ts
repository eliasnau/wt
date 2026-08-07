import { createContext } from "@matdesk/api/context";
import { appRouter } from "@matdesk/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createRouterClient } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { parseError } from "evlog";

// Codes that will never succeed on retry — fail fast instead of hammering the server.
const NON_RETRYABLE_CODES = new Set([
  "org.NO_ACTIVE_ORGANIZATION",
  "ratelimit.EXCEEDED",
]);

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Surface failures immediately in development.
          if (import.meta.env.DEV) return false;
          const { code, status } = parseError(error);
          if (code && NON_RETRYABLE_CODES.has(code)) return false;
          // Client errors (no active org, rate limit, auth, …) won't fix themselves.
          if (status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

// Browser code needs one stable cache. Server requests must create their own
// QueryClient in getRouter() so one user's dehydrated data cannot reach another.
export const queryClient = createQueryClient();

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(appRouter, {
      context: async () => {
        return createContext({ req: getRequest() });
      },
    }),
  )
  .client((): RouterClient<typeof appRouter> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/rpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    });

    return createORPCClient(link);
  });

export const client: RouterClient<typeof appRouter> = getORPCClient();

export const orpc = createTanstackQueryUtils(client);

import { os } from "@orpc/server";
import type { ResponseHeadersPluginContext } from "@orpc/server/plugins";
import type { EvlogOrpcContext } from "evlog/orpc";

import type { Context } from "./context";

/** Per-procedure metadata read by middlewares. */
export interface RouterMeta {
  /**
   * Token-bucket cost of this procedure for rate limiting — how many tokens it
   * consumes. Heavier/compute-intensive procedures should set a higher value.
   * Defaults to 1 when unset.
   */
  cost?: number;
}

// Base oRPC builder.
//  - `log` is optional on the context: `withEvlog()` injects it for HTTP
//    requests (one wide event each), but it's absent for in-process server-side
//    calls via `createRouterClient` (SSR). Treat `context.log` as possibly
//    undefined in middlewares and handlers.
//  - `resHeaders` is injected by `ResponseHeadersPlugin` (registered on the
//    fetch handlers); middlewares mutate it to set response headers.
//  - `$meta` seeds typed, empty `RouterMeta` so procedures can opt into a cost
//    via `.meta({ cost: N })` and middlewares can read it off `procedure`.
export const o = os
  .$context<Context & Partial<EvlogOrpcContext> & ResponseHeadersPluginContext>()
  .$meta<RouterMeta>({});

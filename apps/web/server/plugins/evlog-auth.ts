import { auth } from "@matdesk/auth";
import { createAuthIdentifier, type BetterAuthInstance } from "evlog/better-auth";
import { definePlugin } from "nitro";

export default definePlugin((nitroApp) => {
  const identifier = createAuthIdentifier(auth as BetterAuthInstance, {
    // `/api/rpc/**` is excluded from Nitro's wide events, so identifying
    // the user here would just fetch the session for a no-op logger. The
    // oRPC layer re-identifies the user on its own event instead.
    exclude: ["/api/auth/**", "/api/rpc/**"],
    maskEmail: true,
  });

  // evlog v2.18 types its handler against the old h3 v1 event shape
  // (`{ path, headers, context }`), while h3 v2+ exposes `HTTPEvent`. The
  // fields evlog reads are still present at runtime — this is a pure type
  // bridge. Remove when evlog publishes h3 v2-compatible types.
  // @ts-expect-error -- see comment above
  nitroApp.hooks.hook("request", identifier);
});

import { auth } from "@matdesk/auth";
import { createAuthIdentifier, type BetterAuthInstance } from "evlog/better-auth";
import { definePlugin } from "nitro";

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook(
    "request",
    createAuthIdentifier(auth as BetterAuthInstance, {
      // `/api/rpc/**` is excluded from Nitro's wide events, so identifying
      // the user here would just fetch the session for a no-op logger. The
      // oRPC layer re-identifies the user on its own event instead.
      exclude: ["/api/auth/**", "/api/rpc/**"],
      maskEmail: true,
    }),
  );
});

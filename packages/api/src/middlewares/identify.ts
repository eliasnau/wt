import { identifyUser } from "evlog/better-auth";

import { o } from "../orpc";

/**
 * Attribute the user on the wide event whenever a session exists — including
 * public procedures. Attribution only, never rejects (that's `requireAuth`).
 */
export const identify = o.middleware(async ({ context, next }) => {
  if (context.log && context.session) {
    identifyUser(context.log, context.session, { maskEmail: true });
  }
  return next();
});

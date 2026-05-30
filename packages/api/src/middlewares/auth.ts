import { createError } from "evlog";

import { o } from "../orpc";

/**
 * Require an authenticated session, narrowing `session` to non-null. The user
 * is already identified on the event by `identify`. 
 */
export const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw createError({
      message: "Authentication required",
      code: "UNAUTHORIZED",
      status: 401,
      why: "No active session was found for this request",
      fix: "Sign in and retry the request",
    });
  }

  return next({
    context: {
      session: context.session,
    },
  });
});

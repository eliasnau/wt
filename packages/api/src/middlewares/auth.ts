import { authErrors } from "../errors";
import { o } from "../orpc";

/**
 * Require an authenticated session, narrowing `session` to non-null. The user
 * is already identified on the wide event by `identify`.
 */
export const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw authErrors.UNAUTHORIZED();
  }

  return next({
    context: {
      session: context.session,
    },
  });
});

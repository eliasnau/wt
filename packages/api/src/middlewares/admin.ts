import { adminErrors } from "../errors";
import { o } from "../orpc";

/**
 * Require a platform admin (better-auth admin plugin `role === "admin"`) — NOT
 * an organization admin. Compose on top of `protectedProcedure`.
 */
export const requireAdmin = o.middleware(async ({ context, next }) => {
  // The session user type is a union; the role lives on the admin-plugin branch.
  const role = (context.session?.user as { role?: string | null } | undefined)?.role;
  if (role !== "admin") {
    throw adminErrors.NOT_PLATFORM_ADMIN();
  }
  return next();
});

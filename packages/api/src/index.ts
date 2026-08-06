import { evlog } from "evlog/orpc";

import { requireAdmin } from "./middlewares/admin";
import { requireAuth } from "./middlewares/auth";
import { identify } from "./middlewares/identify";
import { requireOrganization } from "./middlewares/organization";
import { rateLimit } from "./middlewares/ratelimit";
import { o } from "./orpc";

export { o };

// evlog() outermost so it captures errors from inner middlewares + sets `operation`.
export const publicProcedure = o.use(evlog()).use(identify).use(rateLimit);

export const protectedProcedure = publicProcedure.use(requireAuth);

/**
 * Org-scoped base procedure: guarantees a non-null `organizationId` on the
 * context (throws 400 if the session has no active org). Use as the base for
 * any procedure that operates on data belonging to an organization. Compose
 * `requirePermission(...)` on top for per-resource permission checks.
 */
export const orgProcedure = protectedProcedure.use(requireOrganization);

/**
 * Platform-admin base procedure: requires the better-auth admin-plugin
 * `role === "admin"`. Operates across organizations, not scoped to one.
 */
export const adminProcedure = protectedProcedure.use(requireAdmin);

import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";

/**
 * @param permission - Clerk permission string to check
 * @returns Middleware that verifies user has the required permission
 * @example
 * protectedProcedure.use(requirePermission("members:read")).handler(...)
 */
export const requirePermission = (permission: string) => {
	return os
		.$context<Context & { user: { id: string } }>()
		.middleware(async ({ context, next }) => {
			const hasPermission = context.has({ permission });

			if (!hasPermission) {
				throw new ORPCError("FORBIDDEN", {
					message: `You don't have permission`,
				});
			}

			return next();
		});
};

import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";

/**
 * @returns Middleware that verifies if user is authenticated
 * @example
 * const protectedRoute = o.use(authMiddleware).handler(...)
 */
export const authMiddleware = os
	.$context<Context>()
	.middleware(async ({ context, next }) => {
		if (!context.userId) {
			throw new ORPCError('UNAUTHORIZED', {
				message: "You must be signed in to access this resource",
			});
		}

		return next({
			context: {
				user: {
					id: context.userId,
					sessionId: context.sessionId,
					orgId: context.orgId,
				},
			},
		});
	});

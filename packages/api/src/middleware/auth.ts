import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";

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

import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";
import { logger } from "../lib/logger";
import { ipAddress, geolocation } from "@vercel/functions";
import { after } from "next/server";

/**
 * @returns Middleware that verifies user authentication
 * @example
 * const protectedRoute = o.use(authMiddleware).handler(...)
 */
export const authMiddleware = os
	.$context<Context>()
	.middleware(async ({ context, next }) => {
		if (!context.userId) {
			after(() => {
				const geo = geolocation(context.req);
				logger.warn("Unauthorized request attempt", {
					path: context.req.nextUrl.pathname,
					method: context.req.method,
					ip: ipAddress(context.req),
					geo: {
						city: geo.city,
						country: geo.country,
						region: geo.region,
					},
				});
			});
			
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

import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";
import { logger } from "../lib/logger";
import { ipAddress, geolocation } from "@vercel/functions";
import { after } from "next/server";
import { auth } from "@repo/auth";

/**
 * Middleware that verifies user authentication using Better Auth
 * @returns Middleware that adds session and user to context
 * @throws {ORPCError} UNAUTHORIZED if no valid session is found
 * @example
 * const protectedRoute = o.use(authMiddleware).handler(...)
 */
export const authMiddleware = os
	.$context<Context>()
	.middleware(async ({ context, next }) => {
		const sessionData = await auth.api.getSession({
			headers: context.headers,
		});

		if (!sessionData?.session || !sessionData?.user) {
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

			throw new ORPCError("UNAUTHORIZED", {
				message: "You must be signed in to access this resource",
			});
		}

		return next({
			context: {
				userId: sessionData.user.id,
				session: sessionData.session,
				user: sessionData.user,
			},
		});
	});

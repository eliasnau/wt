import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";
import { logger } from "../lib/logger";
import { ipAddress, geolocation } from "@vercel/functions";
import { after } from "next/server";

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
				after(() => {
					const geo = geolocation(context.req);
					logger.warn("Permission denied", {
						userId: context.user.id,
						permission,
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

				throw new ORPCError("FORBIDDEN", {
					message: `You don't have permission`,
				});
			}

			return next();
		});
};

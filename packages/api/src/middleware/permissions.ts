import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";
import { logger } from "../lib/logger";
import { ipAddress, geolocation } from "@vercel/functions";
import { after } from "next/server";
import { auth, type PermissionCheck } from "@repo/auth";

/**
 * @param permissions - Better Auth permission object to check
 * @returns Middleware that verifies user has the required permissions
 * @example
 * protectedProcedure.use(requirePermission({ member: ["view"] })).handler(...)
 * protectedProcedure.use(requirePermission({ finance: ["view", "export"] })).handler(...)
 */
export const requirePermission = (permissions: PermissionCheck) => {
	return os
		.$context<Context & { user: { id: string } }>()
		.middleware(async ({ context, next }) => {
			const result = await auth.api.hasPermission({
				headers: context.headers,
				body: { permissions },
			});

			const hasPermission =
				typeof result === "boolean" ? result : result?.success === true;

			if (!hasPermission) {
				after(() => {
					const geo = geolocation(context.req);
					logger.warn("Permission denied", {
						userId: context.user.id,
						permissions,
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

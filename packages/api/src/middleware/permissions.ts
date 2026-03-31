import { ORPCError, os } from "@orpc/server";
import { auth, type PermissionCheck } from "@repo/auth";
import { geolocation, ipAddress } from "@vercel/functions";
import { after } from "next/server";
import type { Context } from "../context";
import { logger } from "../lib/logger";

/**
 * @param permissions - Better Auth permission object to check
 * @returns Middleware that verifies user has the required permissions
 * @example
 * protectedProcedure.use(requirePermission({ member: ["view"] })).handler(...)
 * protectedProcedure.use(requirePermission({ paymentBatches: ["view"] })).handler(...)
 */
export const requirePermission = (permissions: PermissionCheck) => {
	return os.$context<Context>().middleware(async ({ context, next }) => {
		if (!context.session) {
			throw new Error(
				"requirePermission middleware must be used after authMiddleware. " +
					"Ensure your procedure chain includes authMiddleware before requirePermission.",
			);
		}

		const organizationId = context.session.activeOrganizationId;

		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "No active organization selected",
			});
		}
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
					userId: context.user!.id,
					organizationId,
					permissions,
					request_id: context.wideEvent.request_id,
					trace_id: context.wideEvent.trace_id,
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

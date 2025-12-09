import arcjet, { tokenBucket } from "@arcjet/next";
import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";
import { logger } from "../lib/logger";
import { ipAddress, geolocation } from "@vercel/functions";
import { after } from "next/server";

const aj = arcjet({
	key: process.env.ARCJET_KEY!,
	rules: [
		tokenBucket({
			mode: "LIVE",
			characteristics: ["userId"],
			refillRate: 10,
			interval: 60,
			capacity: 100,
		}),
	],
});

/**
 * @param tokensToConsume - Number of tokens to consume from the bucket (default: 1)
 * @example
 * protectedProcedure.use(rateLimitMiddleware(5)).handler(...)
 */
export function rateLimitMiddleware(tokensToConsume: number = 1) {
	return os.$context<Context>().middleware(async ({ context, next }) => {
		if (!context.userId) {
			throw new ORPCError("UNAUTHORIZED", {
				message: "Authentication required for rate-limited endpoints",
			});
		}

		const decision = await aj.protect(context.req, {
			userId: context.userId,
			requested: tokensToConsume,
		});

		if (decision.isDenied()) {
			after(() => {
				const geo = geolocation(context.req);
				logger.warn("Rate limit exceeded", {
					userId: context.userId,
					path: context.req.nextUrl.pathname,
					method: context.req.method,
					tokensRequested: tokensToConsume,
					ip: ipAddress(context.req),
					geo: {
						city: geo.city,
						country: geo.country,
						region: geo.region,
					},
				});
			});
			
			throw new ORPCError("TOO_MANY_REQUESTS", {
				message: "Rate limit exceeded. Please try again later.",
				...(decision.reason.isRateLimit() && {
					retryAfter: decision.reason.resetTime,
				}),
			});
		}

		return next({ context });
	});
}

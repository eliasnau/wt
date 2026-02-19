import arcjet, { tokenBucket } from "@arcjet/next";
import { ORPCError, os } from "@orpc/server";
import { env } from "@repo/env/web";
import { geolocation, ipAddress } from "@vercel/functions";
import { after } from "next/server";
import type { Context } from "../context";
import { logger } from "../lib/logger";

const aj = arcjet({
	key: env.ARCJET_KEY!,
	rules: [
		tokenBucket({
			mode: "LIVE",
			characteristics: ["userId"],
			refillRate: 30,
			interval: 60,
			capacity: 100,
		}),
	],
});

/**
 * Middleware that enforces rate limiting using Arcjet token bucket
 * @param tokensToConsume - Number of tokens to consume from the bucket (default: 1)
 * @returns Middleware that checks rate limits before allowing request
 * @throws {ORPCError} UNAUTHORIZED if authMiddleware was not used before this middleware
 * @throws {ORPCError} TOO_MANY_REQUESTS if rate limit is exceeded
 * @example
 * protectedProcedure.use(rateLimitMiddleware(5)).handler(...)
 */
export function rateLimitMiddleware(tokensToConsume = 1) {
	return os.$context<Context>().middleware(async ({ context, next }) => {
		const userId = context.session?.userId;

		if (!userId) {
			throw new Error(
				"Rate limiting middleware used without authentication. Ensure authMiddleware is used before rateLimitMiddleware.",
			);
		}

		const decision = await aj.protect(context.req, {
			userId: userId,
			requested: tokensToConsume,
		});

		if (decision.isDenied()) {
			after(() => {
				const geo = geolocation(context.req);
				logger.warn("Rate limit exceeded", {
					trace_id: context.wideEvent?.trace_id,
					request_id: context.wideEvent?.request_id,
					user_id: userId,
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

		return next();
	});
}

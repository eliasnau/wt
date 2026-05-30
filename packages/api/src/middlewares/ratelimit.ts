import { env } from "@matdesk/env/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createError } from "evlog";

import { o } from "../orpc";

// Shared token-bucket limiter, built only when Upstash is configured (otherwise
// rate limiting is silently ignored). Token bucket lets each procedure spend a
// different number of tokens via its `cost` meta, with bursts up to maxTokens.
// refillRate=10 per "10 s", maxTokens=20 → ~1 token/sec sustained, burst of 20.
const ratelimit =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.tokenBucket(10, "10 s", 20),
        analytics: true,
        prefix: "matdesk-orpc",
      })
    : null;

/** Standard rate-limit headers (epoch-seconds reset), set on success and 429. */
function setRateLimitHeaders(
  headers: Headers | undefined,
  limit: number,
  remaining: number,
  reset: number,
) {
  if (!headers) return;
  headers.set("X-RateLimit-Limit", String(limit));
  headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  headers.set("X-RateLimit-Reset", String(Math.ceil(reset / 1000)));
}

/**
 * Token-bucket limiter keyed per user (IP fallback for anonymous). Token cost
 * comes from the procedure's `cost` meta (default 1). Records the decision on
 * the event and sets rate-limit headers (incl. `Retry-After` on 429).
 */
export const rateLimit = o.middleware(async ({ context, procedure, next }) => {
  const cost = procedure["~orpc"].meta.cost ?? 1;

  if (!ratelimit) {
    context.log?.set({ rateLimit: { enabled: false, cost } });
    console.warn("[orpc] Ratelimit is disabled. Set UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN to enable")
    return next();
  }

  const userId = context.session?.user?.id;
  const identifier = userId ? `user:${userId}` : `ip:${context.ipAddress ?? "anonymous"}`;

  const { success, limit, remaining, reset } = await ratelimit.limit(identifier, {
    rate: cost,
  });

  setRateLimitHeaders(context.resHeaders, limit, remaining, reset);

  context.log?.set({
    rateLimit: { enabled: true, cost, limit, remaining, throttled: !success },
  });

  if (!success) {
    const retryAfterSec = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    context.resHeaders?.set("Retry-After", String(retryAfterSec));

    throw createError({
      message: "Rate limit exceeded",
      code: "TOO_MANY_REQUESTS",
      status: 429,
      why: `Too many requests for ${identifier} (needed ${cost} token(s), ${remaining} remaining)`,
      fix: `Retry after ${new Date(reset).toISOString()}`,
    });
  }

  return next();
});

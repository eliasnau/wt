import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_API_KEY: z.string().min(1).optional(),
    BETTER_AUTH_API_URL: z.url().optional(),
    BETTER_AUTH_KV_URL: z.url().optional(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Optional: when both are set, oRPC rate limiting uses Upstash. When unset
    // (e.g. local dev without an Upstash instance), rate limiting fails open.
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

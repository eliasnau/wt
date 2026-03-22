import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		POSTHOG_API_KEY: z.string(),
		POSTHOG_ENV_ID: z.string(),

		// Security
		ARCJET_KEY: z.string().optional(),

		// Observability
		AXIOM_TOKEN: z.string().optional(),
		AXIOM_DATASET: z.string().optional(),

		// Database
		DATABASE_URL: z.string(), //String so it alows "*" pattern

		// Better Auth
		BETTER_AUTH_SECRET: z.string().min(32).optional(),
		AUTUMN_SECRET_KEY: z.string().startsWith("am_sk_").optional(),

		RESEND_API_KEY: z.string().startsWith("re_"),
	},
	client: {
		// PostHog Analytics
		NEXT_PUBLIC_POSTHOG_KEY: z.string(),
		NEXT_PUBLIC_POSTHOG_HOST: z.url(),
		NEXT_PUBLIC_MATDESK_DOCS_URL: z.url().optional(),
	},
	runtimeEnv: {
		// Server
		POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
		POSTHOG_ENV_ID: process.env.POSTHOG_ENV_ID,

		ARCJET_KEY: process.env.ARCJET_KEY,

		AXIOM_TOKEN: process.env.AXIOM_TOKEN,
		AXIOM_DATASET: process.env.AXIOM_DATASET,

		DATABASE_URL: process.env.DATABASE_URL,

		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		AUTUMN_SECRET_KEY: process.env.AUTUMN_SECRET_KEY,

		// Client
		NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
		NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
		NEXT_PUBLIC_MATDESK_DOCS_URL:
			process.env.NEXT_PUBLIC_MATDESK_DOCS_URL ?? process.env.MATDESK_DOCS_URL,

		RESEND_API_KEY: process.env.RESEND_API_KEY,
	},
	emptyStringAsUndefined: true,
});

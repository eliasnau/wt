import { passkey } from "@better-auth/passkey";
import { db } from "@repo/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { organization, twoFactor } from "better-auth/plugins";
import { ac, admin, member, owner } from "./permissions";
import { manageSessions } from "./plugins/manageSessions";
import { haveIBeenPwned } from "better-auth/plugins"

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	// secondaryStorage: {
	// 	get: async (key) => {
	// 		return await redis.get(key);
	// 	},
	// 	set: async (key, value, ttl) => {
	// 		if (ttl) await redis.set(key, value, { ex: ttl });
	// 		else await redis.set(key, value);
	// 	},
	// 	delete: async (key) => {
	// 		await redis.del(key);
	// 	}
	// },
	// rateLimit: {
	// 	storage: "secondary-storage",
	// 	window: 60,
    //     max: 100,
	// },
	emailAndPassword: {
		enabled: true,
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 3 * 60,
		},
	},
	baseURL: process.env.BETTER_AUTH_URL || process.env.VERCEL_URL || "http://localhost:3001",
	trustedOrigins: [process.env.VERCEL_URL!, process.env.BETTER_AUTH_URL!],
	secret: process.env.BETTER_AUTH_SECRET!,
	emailVerification: {
		sendVerificationEmail: async ({ url }) => {
			console.log("Email Verification: ", url);
		},
	},
	plugins: [
		passkey(),
		organization({
			ac,
			roles: {
				owner,
				admin,
				member,
			},
			disableOrganizationDeletion: true,
			dynamicAccessControl: {
				enabled: true,
			},
			membershipLimit: 15,
		}),
		twoFactor({
			issuer: "WT",
		}),
		manageSessions(),
		haveIBeenPwned({
			customPasswordCompromisedMessage: "This password has been found in a Data breach. Please choose a more secure one"
		}),
		nextCookies(), //! has to be last plugin in array
	],
	experimental: { joins: true },
});

export type Session = typeof auth.$Infer.Session;

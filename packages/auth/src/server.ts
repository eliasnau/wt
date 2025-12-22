import { passkey } from "@better-auth/passkey";
import { db } from "@repo/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { organization, twoFactor } from "better-auth/plugins";
import { ac, admin, member, owner } from "./permissions";
import { manageSessions } from "./plugins/manageSessions";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 3 * 60,
		},
	},
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
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
			dynamicAccessControl: {
				enabled: true,
			},
		}),
		twoFactor({
			issuer: "WT",
		}),
		manageSessions(),
		nextCookies(), //! has to be last plugin in array
	],
	experimental: { joins: true },
});

export type Session = typeof auth.$Infer.Session;

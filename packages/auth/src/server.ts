import { betterAuth } from "better-auth/minimal"; 
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@repo/db";
import { passkey } from "@better-auth/passkey";
import { organization, twoFactor } from "better-auth/plugins";
import {
	ac,
	owner,
	admin,
	member,
} from "./permissions";

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
		  maxAge: 5 * 60,
		},
	  },
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
	secret: process.env.BETTER_AUTH_SECRET!,
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
		nextCookies(), //! has to be last plugin in array
	],
	experimental: { joins: true },
});

export type Session = typeof auth.$Infer.Session;

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@repo/db";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins"


export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
	},
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
	secret: process.env.BETTER_AUTH_SECRET!,
	plugins: [
		passkey(),
		twoFactor({
			issuer: "WT"
		}),
		nextCookies(), //! has to be last plugin in array
	],
	experimental: { joins: true }
});

export type Session = typeof auth.$Infer.Session;

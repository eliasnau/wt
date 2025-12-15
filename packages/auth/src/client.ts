import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import {
	organizationClient,
	twoFactorClient,
} from "better-auth/client/plugins";
import {
	ac,
	owner,
	admin,
	member,
	projectManager,
	analyst,
	viewer,
} from "./permissions";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
	plugins: [
		passkeyClient(),
		twoFactorClient(),
		organizationClient({
			ac,
			roles: {
				owner,
				admin,
				member,
				projectManager,
				analyst,
				viewer,
			},
			dynamicAccessControl: {
				enabled: true,
			},
		}),
	],
});

export type Session = typeof authClient.$Infer.Session;

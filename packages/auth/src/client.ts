import { passkeyClient } from "@better-auth/passkey/client";
import { APIError } from "better-auth";
import {
	inferAdditionalFields,
	organizationClient,
	twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin, member, owner } from "./permissions";
import { manageSessionsClient } from "./plugins/manageSessions/client";

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
			},
			dynamicAccessControl: {
				enabled: true,
			},
		}),
		manageSessionsClient(),
		inferAdditionalFields({
			user: {
				hideSensitiveInformatoin: {
					type: "boolean",
					required: false,
					defaultValue: false,
					input: true,
				},
			},
		}),
	],
});

export type Session = typeof authClient.$Infer.Session;

export { APIError };

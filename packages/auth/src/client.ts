import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
	plugins: [
		passkeyClient()
	]
});

export type Session = typeof authClient.$Infer.Session;

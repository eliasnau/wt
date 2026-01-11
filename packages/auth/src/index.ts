export { auth } from "./server";
export type { Session } from "./server";
export { getSessionCookie } from "better-auth/cookies";
export { toNextJsHandler } from "better-auth/next-js";
export { authClient } from "./client";
export { ac, owner, admin, member, roles, statement } from "./permissions";
export type {
	RoleName,
	PermissionResource,
	PermissionAction,
	PermissionCheck,
} from "./permissions";
export type { Passkey } from "@better-auth/passkey"

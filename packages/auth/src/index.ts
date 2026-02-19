export type { Passkey } from "@better-auth/passkey";
export { getSessionCookie } from "better-auth/cookies";
export { toNextJsHandler } from "better-auth/next-js";
export { authClient } from "./client";
export type {
	PermissionAction,
	PermissionCheck,
	PermissionResource,
	RoleName,
} from "./permissions";
export { ac, admin, member, owner, roles, statement } from "./permissions";
export type { Session } from "./server";
export { auth } from "./server";

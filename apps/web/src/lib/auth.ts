import type { PermissionCheck } from "@repo/auth/server";
import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { forbidden, unauthorized } from "next/navigation";
import { cache } from "react";

export const getServerSession = cache(async () => {
	const session = await auth.api.getSession({ headers: await headers() });
	return session;
});

export const hasPermission = cache(async (permissions: PermissionCheck) => {
	const result = await auth.api.hasPermission({
		headers: await headers(),
		body: { permissions },
	});
	return result;
});

export const protectPage = async () => {
	const session = await getServerSession();
	if (session && session.user) {
		return session;
	}
	return unauthorized();
};

export const requirePermission = cache(async (permissions: PermissionCheck) => {
	const result = await hasPermission(permissions);
	if (!result.success) return forbidden();
});

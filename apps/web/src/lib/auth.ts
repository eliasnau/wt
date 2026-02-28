import type { PermissionCheck } from "@repo/auth";
import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { forbidden, redirect, unauthorized } from "next/navigation";
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

export const getOrganization = cache(async () => {
	const data = await auth.api.getFullOrganization({
		query: {
			membersLimit: 100,
		},
		headers: await headers(),
	});
	return data;
});

export const protectPage = async () => {
	const session = await getServerSession();
	if (session?.user) {
		return session;
	}
	return unauthorized();
};

export const requirePermission = async (permissions: PermissionCheck) => {
	const result = await hasPermission(permissions);
	if (!result.success) return forbidden();
};

export const requireActiveOrg = async () => {
	const session = await getServerSession();

	if (!session?.user) return unauthorized();
	if (!session.session.activeOrganizationId) return redirect("/organizations");

	const data = await getOrganization();

	if (!data) {
		redirect("/account/organizations");
	}

	return { session, organization: data };
};

export const protectPageFresh = async () => {
	const session = await auth.api.getSession({
		query: {
			disableCookieCache: true,
		},
		headers: await headers(),
	});

	if (session?.user) {
		return session;
	}

	return unauthorized();
};

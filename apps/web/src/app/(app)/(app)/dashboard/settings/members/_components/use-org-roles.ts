"use client";

import { authClient } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";
import { defaultRoleNames } from "./role-utils";

export type OrganizationRole = {
	id: string;
	role: string;
	permission: Record<string, string[]> | null;
	createdAt?: string;
	updatedAt?: string;
};

export function useOrgRoles() {
	const { data: activeOrg } = authClient.useActiveOrganization();

	const rolesQuery = useQuery({
		queryKey: ["organization-roles", activeOrg?.id],
		retry: 1,
		queryFn: async () => {
			if (!activeOrg?.id) return [] as OrganizationRole[];
			const result = await authClient.organization.listRoles({
				query: { organizationId: activeOrg.id },
			});
			if (result.error) {
				throw new Error(result.error.message || "Failed to load roles");
			}
			return result.data as OrganizationRole[];
		},
		enabled: !!activeOrg,
	});

	const dynamicRoles = rolesQuery.data ?? [];
	const dynamicRoleNames = dynamicRoles.map((role) => role.role).sort();
	const roleOptions = [
		...defaultRoleNames,
		...dynamicRoleNames.filter((role) => !defaultRoleNames.includes(role)),
	];

	return {
		...rolesQuery,
		dynamicRoles,
		dynamicRoleNames,
		roleOptions,
		defaultRoleNames,
	};
}

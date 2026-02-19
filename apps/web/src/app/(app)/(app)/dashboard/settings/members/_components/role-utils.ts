import {
	roles as builtinRoles,
	customResources,
	statement,
} from "@repo/auth/permissions";

export type PermissionMap = Record<string, string[]>;

export const defaultRoleNames = Object.keys(builtinRoles);

export const builtinRolePermissions = Object.fromEntries(
	Object.entries(builtinRoles).map(([name, role]) => [
		name,
		role.statements as PermissionMap,
	]),
) as Record<string, PermissionMap>;

const hiddenResources = new Set(["team", "teams"]);

export type PermissionResourceItem = {
	resource: string;
	actions: string[];
};

const allPermissionResources: PermissionResourceItem[] = Object.entries(
	statement,
)
	.filter(([resource]) => !hiddenResources.has(resource))
	.map(([resource, actions]) => ({
		resource,
		actions: [...actions] as string[],
	}))
	.sort((a, b) => a.resource.localeCompare(b.resource));

const customResourceSet = new Set<string>(customResources as string[]);

export const permissionResources = allPermissionResources;

export const permissionResourceGroups = [
	{
		id: "custom",
		title: "App permissions",
		description: "Permissions specific to your product features.",
		resources: allPermissionResources.filter(({ resource }) =>
			customResourceSet.has(resource),
		),
	},
	{
		id: "built-in",
		title: "Core permissions",
		description:
			"Foundation permissions used across accounts and access control.",
		resources: allPermissionResources.filter(
			({ resource }) => !customResourceSet.has(resource),
		),
	},
] as const;

export function formatRoleLabel(role: string) {
	return role
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function flattenPermissions(permissions?: PermissionMap | null) {
	if (!permissions) return [] as string[];
	const entries = Object.entries(permissions);
	const flattened: string[] = [];
	for (const [resource, actions] of entries) {
		for (const action of actions ?? []) {
			flattened.push(`${resource}:${action}`);
		}
	}
	return flattened;
}

export function countPermissions(permissions?: PermissionMap | null) {
	return flattenPermissions(permissions).length;
}

export function normalizePermissions(permissions: PermissionMap) {
	const next: PermissionMap = {};
	for (const [resource, actions] of Object.entries(permissions)) {
		if (actions && actions.length > 0) {
			next[resource] = actions;
		}
	}
	return next;
}

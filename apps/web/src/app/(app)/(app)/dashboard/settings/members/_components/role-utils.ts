import {
	customResources,
	roles as builtinRoles,
	statement,
} from "@repo/auth/permissions";
import type { PermissionCheck } from "@repo/auth/permissions";

export const defaultRoleNames = Object.keys(builtinRoles);

export const builtinRolePermissions = Object.fromEntries(
	Object.entries(builtinRoles).map(([name, role]) => [
		name,
		role.statements as PermissionCheck,
	]),
) as Record<string, PermissionCheck>;

const hiddenResources = new Set(["team", "teams"]);

const allPermissionResources = Object.entries(statement)
	.filter(([resource]) => !hiddenResources.has(resource))
	.map(([resource, actions]) => ({
		resource,
		actions: [...actions] as string[],
	}))
	.sort((a, b) => a.resource.localeCompare(b.resource));

const customResourceSet = new Set(customResources);

export const permissionResources = allPermissionResources;

export const permissionResourceGroups = [
	{
		id: "custom",
		title: "App permissions",
		description: "Permissions specific to your product features.",
		resources: allPermissionResources.filter(({ resource }) =>
			customResourceSet.has(resource as keyof typeof statement),
		),
	},
	{
		id: "built-in",
		title: "Core permissions",
		description: "Foundation permissions used across accounts and access control.",
		resources: allPermissionResources.filter(
			({ resource }) => !customResourceSet.has(resource as keyof typeof statement),
		),
	},
] as const;

export function formatRoleLabel(role: string) {
	return role
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function flattenPermissions(permissions?: PermissionCheck | null) {
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

export function countPermissions(permissions?: PermissionCheck | null) {
	return flattenPermissions(permissions).length;
}

export function normalizePermissions(permissions: PermissionCheck) {
	const next: PermissionCheck = {};
	for (const [resource, actions] of Object.entries(permissions)) {
		if (actions && actions.length > 0) {
			next[resource as keyof PermissionCheck] = actions;
		}
	}
	return next;
}

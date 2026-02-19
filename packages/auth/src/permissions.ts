import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	memberAc,
	ownerAc,
} from "better-auth/plugins/organization/access";

const customStatement = {
	member: [
		"create",
		"update",
		"delete",
		"list",
		"view",
		"export",
		"view_payment",
	] as const,
	finance: ["view", "download", "export"] as const,
	statistics: ["view", "export"] as const,
	groups: ["view", "create", "update", "delete"] as const,
} as const;

export const statement = {
	...defaultStatements,
	...customStatement,
} as const;

export const customResources = Object.keys(
	customStatement,
) as PermissionResource[];

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
	...ownerAc.statements,
	member: [
		"create",
		"update",
		"delete",
		"list",
		"view",
		"export",
		"view_payment",
	],
	finance: ["view", "download", "export"],
	statistics: ["view", "export"],
	groups: ["view", "create", "update", "delete"],
});

export const admin = ac.newRole({
	...adminAc.statements,
	member: [
		"create",
		"update",
		"delete",
		"list",
		"view",
		"export",
		"view_payment",
	],
	finance: ["view", "download", "export"],
	statistics: ["view", "export"],
	groups: ["view", "create", "update", "delete"],
});

export const member = ac.newRole({
	...memberAc.statements,
	member: ["view"],
	groups: ["view"],
});

export const roles = {
	owner,
	admin,
	member,
} as const;

export type RoleName = keyof typeof roles;

export type PermissionResource = keyof typeof statement;
export type PermissionAction<T extends PermissionResource> =
	(typeof statement)[T][number];

export type PermissionCheck = {
	[K in PermissionResource]?: PermissionAction<K>[];
};

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
	ai: ["chat"] as const,
	sepa: ["view", "update"] as const,
	statistics: ["view"] as const,
	financeStatistics: ["view"] as const,
	paymentBatches: ["view", "generate", "download"] as const,
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
	ai: ["chat"],
	sepa: ["view", "update"],
	statistics: ["view"],
	financeStatistics: ["view"],
	paymentBatches: ["view", "generate", "download"],
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
	ai: ["chat"],
	sepa: ["view", "update"],
	statistics: ["view"],
	financeStatistics: ["view"],
	paymentBatches: ["view", "generate", "download"],
	groups: ["view", "create", "update", "delete"],
});

export const member = ac.newRole({
	...memberAc.statements,
	member: ["view"],
	ai: ["chat"],
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

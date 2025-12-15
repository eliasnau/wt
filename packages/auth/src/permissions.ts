import { createAccessControl } from "better-auth/plugins/access";
import {
	defaultStatements,
	adminAc,
	ownerAc,
	memberAc,
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
} );


export const roles = {
	owner,
	admin,
	member,
} as const;

export type RoleName = keyof typeof roles;

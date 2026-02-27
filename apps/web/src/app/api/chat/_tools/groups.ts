import { and, db, eq, ilike, or, sql } from "@repo/db";
import { clubMember, group, groupMember } from "@repo/db/schema";
import { tool } from "ai";
import { z } from "zod";

export const groupsToolInput = z.object({
	action: z.enum(["search", "count", "byId", "byMember"]),
	query: z
		.string()
		.trim()
		.min(1)
		.max(100)
		.describe("Free-text search over group names. Use '*' for all.")
		.optional(),
	limit: z
		.number()
		.int()
		.min(1)
		.max(50)
		.describe("Maximum number of groups or members to return.")
		.optional(),
	groupId: z.string().describe("Exact group ID.").optional(),
	memberId: z.string().describe("Exact member ID.").optional(),
});

const isPlaceholderId = (value: string) => {
	const compact = value.replaceAll("-", "");
	return compact.length > 0 && /^0+$/.test(compact);
};

const normalizeId = (value?: string) => {
	const normalized = value?.trim();
	if (!normalized || isPlaceholderId(normalized)) {
		return undefined;
	}
	return normalized;
};

export const createGroupsTool = (organizationId: string) =>
	tool({
		description:
			"Work with groups of the current organization: search, count, get by ID, or list groups for a specific member ID.",
		inputSchema: groupsToolInput,
		execute: async ({ action, query, limit, groupId, memberId }) => {
			const safeLimit = Math.min(limit ?? 20, 50);
			const normalizedGroupId = normalizeId(groupId);
			const normalizedMemberId = normalizeId(memberId);
			const normalizedQuery =
				query && query.trim() !== "*" ? query.trim() : undefined;
			const groupSearchFilter = normalizedQuery
				? (() => {
						const like = `%${normalizedQuery}%`;
						return or(ilike(group.name, like));
					})()
				: undefined;

			const baseWhere = and(
				eq(group.organizationId, organizationId),
				groupSearchFilter,
			);

			if (action === "search") {
				const groups = await db
					.select({
						id: group.id,
						name: group.name,
						memberCount: sql<number>`(
							SELECT count(*)::int
							FROM ${groupMember}
							WHERE ${groupMember.groupId} = ${group.id}
						)`,
					})
					.from(group)
					.where(baseWhere)
					.limit(safeLimit);

				return {
					mode: "search",
					count: groups.length,
					groups,
				};
			}

			if (action === "count") {
				const [{ value = 0 } = { value: 0 }] = await db
					.select({ value: sql<number>`count(*)` })
					.from(group)
					.where(baseWhere);

				return {
					mode: "count",
					count: Number(value),
				};
			}

			if (action === "byMember") {
				if (!normalizedMemberId) {
					return {
						mode: "byMember",
						error: "memberId is required for action 'byMember'.",
					};
				}

				const groups = await db
					.select({
						id: group.id,
						name: group.name,
					})
					.from(groupMember)
					.innerJoin(group, eq(group.id, groupMember.groupId))
					.where(
						and(
							eq(group.organizationId, organizationId),
							eq(groupMember.memberId, normalizedMemberId),
							groupSearchFilter,
						),
					)
					.limit(safeLimit);

				const uniqueGroups = Array.from(
					new Map(groups.map((item) => [item.id, item])).values(),
				);

				return {
					mode: "byMember",
					count: uniqueGroups.length,
					groups: uniqueGroups,
				};
			}

			if (action === "byId") {
				if (!normalizedGroupId) {
					return {
						mode: "byId",
						error: "groupId is required for action 'byId'.",
					};
				}

				const selectedGroup = await db
					.select({
						id: group.id,
						name: group.name,
					})
					.from(group)
					.where(
						and(
							eq(group.organizationId, organizationId),
							eq(group.id, normalizedGroupId),
						),
					)
					.limit(1);

				if (selectedGroup.length === 0) {
					return {
						mode: "byId",
						found: false,
						message: "Group not found.",
					};
				}

				const [{ value: memberCount = 0 } = { value: 0 }] = await db
					.select({ value: sql<number>`count(*)` })
					.from(groupMember)
					.where(eq(groupMember.groupId, normalizedGroupId));

				const members = await db
					.select({
						id: clubMember.id,
						firstName: clubMember.firstName,
						lastName: clubMember.lastName,
						email: clubMember.email,
						phone: clubMember.phone,
						joinedAt: clubMember.createdAt,
					})
					.from(groupMember)
					.innerJoin(clubMember, eq(clubMember.id, groupMember.memberId))
					.where(
						and(
							eq(groupMember.groupId, normalizedGroupId),
							eq(clubMember.organizationId, organizationId),
						),
					)
					.limit(safeLimit);

				return {
					mode: "byId",
					found: true,
					group: {
						id: selectedGroup[0].id,
						name: selectedGroup[0].name,
						memberCount: Number(memberCount),
						members: members.map((member) => ({
							id: member.id,
							name: `${member.firstName} ${member.lastName}`.trim(),
							email: member.email,
							phone: member.phone,
							joinedAt: member.joinedAt,
						})),
					},
				};
			}

			return { error: "Unsupported action." };
		},
	});

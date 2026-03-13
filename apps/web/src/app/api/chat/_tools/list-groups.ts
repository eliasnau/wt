import { and, db, eq, ilike, or, sql } from "@repo/db";
import { group, groupMember } from "@repo/db/schema";
import { tool } from "ai";
import { z } from "zod";

const listGroupsInputSchema = z.object({
	search: z
		.string()
		.trim()
		.min(1)
		.max(100)
		.describe("Free-text search across group names and descriptions.")
		.optional(),
	limit: z.number().int().min(1).max(25).default(10).optional(),
});

export const createListGroupsTool = (organizationId: string) =>
	tool({
		description:
			"List groups for the current organization, optionally filtered by group name or description. Use this to resolve a human group name to a concrete group ID before querying members by group.",
		inputSchema: listGroupsInputSchema,
		execute: async ({ search, limit }) => {
			const normalizedSearch = search?.trim();
			const where = and(
				eq(group.organizationId, organizationId),
				normalizedSearch
					? or(
							ilike(group.name, `%${normalizedSearch}%`),
							ilike(group.description, `%${normalizedSearch}%`),
						)
					: undefined,
			);

			const groups = await db
				.select({
					id: group.id,
					name: group.name,
					description: group.description,
					color: group.color,
					defaultMembershipPrice: group.defaultMembershipPrice,
					memberCount: sql<number>`(
						select count(*)::int
						from ${groupMember}
						where ${groupMember.groupId} = ${group.id}
					)`,
				})
				.from(group)
				.where(where)
				.orderBy(group.name)
				.limit(limit ?? 10);

			return {
				count: groups.length,
				groups,
			};
		},
	});

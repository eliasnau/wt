import { and, count, db, eq, ilike, inArray, or, sql } from "@repo/db";
import { clubMember, contract, group, groupMember } from "@repo/db/schema";
import { tool } from "ai";
import { cache } from "react";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";

// Cache the organization ID retrieval for the current request
const getOrganizationId = cache(async () => {
	const sessionData = await getServerSession();

	if (!sessionData?.user || !sessionData?.session?.activeOrganizationId) {
		throw new Error("Unauthorized: No active organization found");
	}

	return sessionData.session.activeOrganizationId;
});

export const getMembers = tool({
	description:
		"Get a list of members in the organization. You can filter by search query or group IDs.",
	inputSchema: z.object({
		search: z
			.string()
			.optional()
			.describe("Search query for name, email, phone"),
		groupIds: z.array(z.string()).optional().describe("Filter by group IDs"),
		page: z.number().int().min(1).default(1).optional(),
		limit: z.number().int().min(1).max(100).default(20).optional(),
	}),
	execute: async ({ search, groupIds, page = 1, limit = 20 }) => {
		const organizationId = await getOrganizationId();
		const offset = (page - 1) * limit;

		const conditions = [eq(clubMember.organizationId, organizationId)];

		if (search) {
			conditions.push(
				or(
					ilike(clubMember.firstName, `%${search}%`),
					ilike(clubMember.lastName, `%${search}%`),
					ilike(clubMember.email, `%${search}%`),
					ilike(clubMember.phone, `%${search}%`),
					ilike(
						sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
						`%${search}%`,
					),
				)!,
			);
		}

		if (groupIds && groupIds.length > 0) {
			conditions.push(sql`${clubMember.id} IN (
        SELECT ${groupMember.memberId} FROM ${groupMember} 
        WHERE ${inArray(groupMember.groupId, groupIds)}
      )`);
		}

		// Only show members who haven't been cancelled OR are still in their paid period
		conditions.push(sql`EXISTS (
      SELECT 1 FROM ${contract}
      WHERE ${contract.memberId} = ${clubMember.id}
      AND (
        ${contract.cancellationEffectiveDate} IS NULL
        OR ${contract.cancellationEffectiveDate} >= CURRENT_DATE
      )
    )`);

		const whereClause = and(...conditions);

		const membersQuery = db
			.select({
				id: clubMember.id,
				firstName: clubMember.firstName,
				lastName: clubMember.lastName,
				email: clubMember.email,
				phone: clubMember.phone,
				notes: clubMember.notes,
				createdAt: clubMember.createdAt,
			})
			.from(clubMember)
			.where(whereClause)
			.limit(limit)
			.offset(offset);

		const countQuery = db
			.select({ count: count() })
			.from(clubMember)
			.where(whereClause);

		const [members, [{ count: totalCount }]] = await Promise.all([
			membersQuery,
			countQuery,
		]);

		return {
			data: members,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages: Math.ceil(totalCount / limit),
			},
		};
	},
});

export const getMember = tool({
	description: "Get details of a specific member by their ID.",
	inputSchema: z.object({
		memberId: z.string().describe("The UUID of the member"),
	}),
	execute: async ({ memberId }) => {
		const organizationId = await getOrganizationId();

		const member = await db.query.clubMember.findFirst({
			where: and(
				eq(clubMember.id, memberId),
				eq(clubMember.organizationId, organizationId),
			),
			columns: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true,
				street: true,
				city: true,
				state: true,
				postalCode: true,
				country: true,
				notes: true,
				guardianName: true,
				guardianEmail: true,
				guardianPhone: true,
				createdAt: true,
				updatedAt: true,
			},
			with: {
				contract: {
					columns: {
						id: true,
						initialPeriod: true,
						startDate: true,
						initialPeriodEndDate: true,
						currentPeriodEndDate: true,
						nextBillingDate: true,
						cancelledAt: true,
						cancelReason: true,
						cancellationEffectiveDate: true,
						notes: true,
					},
				},
				groupMembers: {
					columns: {
						groupId: true,
						memberId: true,
						createdAt: true,
					},
					with: {
						group: {
							columns: {
								id: true,
								name: true,
								description: true,
							},
						},
					},
				},
			},
		});

		if (!member) {
			throw new Error("Member not found");
		}

		return member;
	},
});

export const getGroups = tool({
	description: "Get a list of all groups in the organization.",
	inputSchema: z.object({}),
	execute: async () => {
		const organizationId = await getOrganizationId();

		const groups = await db.query.group.findMany({
			where: eq(group.organizationId, organizationId),
			orderBy: (groups, { desc }) => [desc(groups.createdAt)],
			columns: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return groups;
	},
});

export const getGroup = tool({
	description: "Get details of a specific group by its ID.",
	inputSchema: z.object({
		id: z.string().describe("The UUID of the group"),
	}),
	execute: async ({ id }) => {
		const organizationId = await getOrganizationId();

		const groupData = await db.query.group.findFirst({
			where: and(eq(group.id, id), eq(group.organizationId, organizationId)),
			columns: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				updatedAt: true,
			},
			with: {
				groupMembers: {
					columns: {
						groupId: true,
						memberId: true,
						createdAt: true,
					},
					with: {
						member: {
							columns: {
								id: true,
								firstName: true,
								lastName: true,
								email: true,
							},
						},
					},
				},
			},
		});

		if (!groupData) {
			throw new Error("Group not found");
		}

		return groupData;
	},
});

export const tools = {
	getMembers,
	getMember,
	getGroups,
	getGroup,
};

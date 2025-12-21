import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, count, db, eq, ilike, inArray, or, sql } from "@repo/db";
import { clubMember, groupMember, group } from "@repo/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";

const createMemberSchema = z.object({
	firstName: z.string().min(1, "First name is required").max(255),
	lastName: z.string().min(1, "Last name is required").max(255),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(1, "Phone is required"),
	street: z.string().min(1, "Street is required"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
});

const listMembersSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().max(255).optional(),
	groupIds: z
		.array(
			z
				.string()
				.min(36, "Must be a valid UUID")
				.max(36, "Must be a valid UUID"),
		)
		.optional(),
});

export const membersRouter = {
	list: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["list"] }))
		.input(listMembersSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const { page, limit } = input;

			const rawSearch = input.search?.trim();
			const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

			const groupIds =
				input.groupIds
					?.map((g) => g.trim())
					.filter(Boolean)
					.filter((v, i, a) => a.indexOf(v) === i) ?? undefined;

			if (input.groupIds && (!groupIds || groupIds.length === 0)) {
				return {
					data: [],
					pagination: {
						page,
						limit,
						totalCount: 0,
						totalPages: 0,
						hasNextPage: false,
						hasPreviousPage: page > 1,
					},
				};
			}

			const offset = (page - 1) * limit;

			const memberWhere = and(
				eq(clubMember.organizationId, organizationId),
				search
					? or(
							ilike(clubMember.firstName, `%${search}%`),
							ilike(clubMember.lastName, `%${search}%`),
							ilike(clubMember.email, `%${search}%`),
							ilike(
								sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
								`%${search}%`,
							),
						)
					: undefined,
				groupIds?.length
					? sql`${clubMember.id} in (
              select ${groupMember.memberId}
              from ${groupMember}
              where ${inArray(groupMember.groupId, groupIds)}
            )`
					: undefined,
			);

			const members = await db
				.select({
					id: clubMember.id,
					firstName: clubMember.firstName,
					lastName: clubMember.lastName,
					email: clubMember.email,
					phone: clubMember.phone,
					organizationId: clubMember.organizationId,
					createdAt: clubMember.createdAt,
					updatedAt: clubMember.updatedAt,
				})
				.from(clubMember)
				.where(memberWhere)
				.limit(limit)
				.offset(offset);

			const [{ count: totalCount = 0 } = { count: 0 }] = await db
				.select({ count: count() })
				.from(clubMember)
				.where(memberWhere);

			const totalPages = Math.ceil(totalCount / limit);

			// Fetch group info for the listed members in one shot
			const memberIds = members.map((m) => m.id);
			let groupMap = new Map<
				string,
				{ groupId: string; group: { id: string; name: string } }[]
			>();
			if (memberIds.length > 0) {
				const gmRows = await db
					.select({
						memberId: groupMember.memberId,
						groupId: groupMember.groupId,
						gId: group.id,
						gName: group.name,
					})
					.from(groupMember)
					.innerJoin(group, eq(group.id, groupMember.groupId))
					.where(inArray(groupMember.memberId, memberIds));

				groupMap = gmRows.reduce((acc, r) => {
					const list = acc.get(r.memberId) ?? [];
					list.push({
						groupId: r.groupId,
						group: { id: r.gId, name: r.gName },
					});
					acc.set(r.memberId, list);
					return acc;
				}, new Map<
					string,
					{ groupId: string; group: { id: string; name: string } }[]
				>());
			}

			const data = members.map((m) => ({
				...m,
				groupMembers: groupMap.get(m.id) ?? [],
			}));

			return {
				data,
				pagination: {
					page,
					limit,
					totalCount,
					totalPages,
					hasNextPage: page < totalPages,
					hasPreviousPage: page > 1,
				},
			};
		})
		.route({ method: "GET", path: "/members" }),

	create: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ member: ["create"] }))
		.input(createMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			const newMember = await db
				.insert(clubMember)
				.values({
					id: randomBytes(16).toString("hex"),
					firstName: input.firstName,
					lastName: input.lastName,
					email: input.email,
					phone: input.phone,
					street: input.street,
					city: input.city,
					state: input.state,
					postalCode: input.postalCode,
					country: input.country,
					organizationId,
				})
				.returning();

			if (!newMember[0]) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create member",
				});
			}

			return newMember[0];
		})
		.route({ method: "POST", path: "/members" }),
};

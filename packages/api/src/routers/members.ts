import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { count, db, eq } from "@repo/db";
import { clubMember } from "@repo/db/schema";
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
});

export const membersRouter = {
	list: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["list"] }))
		.input(listMembersSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const { page, limit } = input;
			const offset = (page - 1) * limit;

			const [members, totalCountResult] = await Promise.all([
				db
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
					.where(eq(clubMember.organizationId, organizationId))
					.limit(limit)
					.offset(offset),
				db
					.select({ count: count() })
					.from(clubMember)
					.where(eq(clubMember.organizationId, organizationId)),
			]);

			const totalCount = totalCountResult[0]?.count ?? 0;
			const totalPages = Math.ceil(totalCount / limit);

			return {
				data: members,
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

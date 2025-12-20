import { protectedProcedure } from "../index";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";
import { db, group, eq } from "@repo/db";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { randomBytes } from "crypto";

const createGroupSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	description: z.string().max(1000).optional(),
	defaultMembershipPrice: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional(),
});

const updateGroupSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Name is required").max(255).optional(),
	description: z.string().max(1000).optional(),
	defaultMembershipPrice: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional(),
});

export const groupsRouter = {
	list: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ groups: ["view"] }))
		.handler(async () => {
			const groups = await db.select().from(group);
			return groups;
		})
		.route({ method: "GET", path: "/groups" }),

	get: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ groups: ["view"] }))
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const result = await db
				.select()
				.from(group)
				.where(eq(group.id, input.id))
				.limit(1);

			if (!result[0]) {
				throw new ORPCError("NOT_FOUND", {
					message: "Group not found",
				});
			}

			return result[0];
		})
		.route({ method: "GET", path: "/groups/:id" }),
	create: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ groups: ["create"] }))
		.input(createGroupSchema)
		.handler(async ({ input }) => {
			const newGroup = await db
				.insert(group)
				.values({
					id: randomBytes(16).toString("hex"),
					name: input.name,
					description: input.description,
					defaultMembershipPrice: input.defaultMembershipPrice,
				})
				.returning();

			if (!newGroup[0]) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create group",
				});
			}

			return newGroup[0];
		})
		.route({ method: "POST", path: "/groups" }),

	update: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ groups: ["update"] }))
		.input(updateGroupSchema)
		.handler(async ({ input }) => {
			const { id, ...updates } = input;

			const cleanUpdates = Object.fromEntries(
				Object.entries(updates).filter(([_, v]) => v !== undefined),
			);

			if (Object.keys(cleanUpdates).length === 0) {
				throw new ORPCError("BAD_REQUEST", {
					message: "No fields to update",
				});
			}

			const updatedGroup = await db
				.update(group)
				.set(cleanUpdates)
				.where(eq(group.id, id))
				.returning();

			if (!updatedGroup[0]) {
				throw new ORPCError("NOT_FOUND", {
					message: "Group not found",
				});
			}

			return updatedGroup[0];
		})
		.route({ method: "PATCH", path: "/groups/:id" }),

		delete: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ groups: ["delete"] }))
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const deletedGroup = await db
				.delete(group)
				.where(eq(group.id, input.id))
				.returning();

			if (!deletedGroup[0]) {
				throw new ORPCError("NOT_FOUND", {
					message: "Group not found",
				});
			}

			return deletedGroup[0];
		})
		.route({ method: "DELETE", path: "/groups/:id" }),
};

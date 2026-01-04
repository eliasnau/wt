import { protectedProcedure } from "../index";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { DB } from "@repo/db/functions";
import { logger } from "../lib/logger";
import { after } from "next/server";

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
		.handler(async ({ context }) => {
			const organizationId = context.session.activeOrganizationId!;

			try {
				const groups = await DB.query.groups.listGroups({ organizationId });
				return groups;
			} catch (error) {
				after(() => {
					logger.error("Failed to list groups", {
						error,
						organizationId,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to retrieve groups",
				});
			}
		})
		.route({ method: "GET", path: "/groups" }),

	get: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ groups: ["view"] }))
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			try {
				const result = await DB.query.groups.getGroupById({
					groupId: input.id,
				});

				if (!result || result.organizationId !== organizationId) {
					throw new ORPCError("NOT_FOUND", {
						message: "Group not found",
					});
				}

				return result;
			} catch (error) {
				if (error instanceof ORPCError) {
					throw error;
				}

				after(() => {
					logger.error("Failed to get group", {
						error,
						organizationId,
						groupId: input.id,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to retrieve group",
				});
			}
		})
		.route({ method: "GET", path: "/groups/:id" }),
	create: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ groups: ["create"] }))
		.input(createGroupSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			try {
				const newGroup = await DB.mutation.groups.createGroup({
					organizationId,
					name: input.name,
					description: input.description,
					defaultMembershipPrice: input.defaultMembershipPrice,
				});

				return newGroup;
			} catch (error) {
				after(() => {
					logger.error("Failed to create group", {
						error,
						organizationId,
						groupName: input.name,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create group",
				});
			}
		})
		.route({ method: "POST", path: "/groups" }),

	update: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ groups: ["update"] }))
		.input(updateGroupSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const { id, ...updates } = input;

			const cleanUpdates = Object.fromEntries(
				Object.entries(updates).filter(([_, v]) => v !== undefined),
			);

			if (Object.keys(cleanUpdates).length === 0) {
				throw new ORPCError("BAD_REQUEST", {
					message: "No fields to update",
				});
			}

			try {
				// Verify group exists and belongs to organization
				const existingGroup = await DB.query.groups.getGroupById({
					groupId: id,
				});

				if (!existingGroup || existingGroup.organizationId !== organizationId) {
					throw new ORPCError("NOT_FOUND", {
						message: "Group not found",
					});
				}

				const updatedGroup = await DB.mutation.groups.updateGroup({
					groupId: id,
					updates: cleanUpdates,
				});

				return updatedGroup!;
			} catch (error) {
				if (error instanceof ORPCError) {
					throw error;
				}

				after(() => {
					logger.error("Failed to update group", {
						error,
						organizationId,
						groupId: id,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update group",
				});
			}
		})
		.route({ method: "PATCH", path: "/groups/:id" }),

	delete: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ groups: ["delete"] }))
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			try {
				// Verify grouup exists and belongs to organization
				const existingGroup = await DB.query.groups.getGroupById({
					groupId: input.id,
				});

				if (!existingGroup || existingGroup.organizationId !== organizationId) {
					throw new ORPCError("NOT_FOUND", {
						message: "Group not found",
					});
				}

				const deletedGroup = await DB.mutation.groups.deleteGroup({
					groupId: input.id,
				});

				return deletedGroup!;
			} catch (error) {
				if (error instanceof ORPCError) {
					throw error;
				}

				after(() => {
					logger.error("Failed to delete group", {
						error,
						organizationId,
						groupId: input.id,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to delete group",
				});
			}
		})
		.route({ method: "DELETE", path: "/groups/:id" }),
};

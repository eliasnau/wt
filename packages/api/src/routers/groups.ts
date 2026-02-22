import { ORPCError } from "@orpc/server";
import { DB } from "@repo/db/functions";
import { after } from "next/server";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { logger } from "../lib/logger";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";
import { getPostHogServer } from "../lib/posthog";

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
      const posthog = getPostHogServer();

      try {
        const groups = await DB.query.groups.listGroups({ organizationId });
        return groups;
      } catch (error) {
        posthog.captureException(error, context.userId, {
          context: "groups:list",
          groups: {
            organization: organizationId,
          },
          trace_id: context.wideEvent.trace_id,
          request_id: context.wideEvent.request_id,
        });

        after(() => {
          posthog.shutdown();
          logger.error("Failed to list groups", {
            error,
            user_id: context.user.id,
            organization_id: organizationId,
            deployment_id: context.wideEvent.deployment_id,
            region: context.wideEvent.region,
            trace_id: context.wideEvent.trace_id,
            request_id: context.wideEvent.request_id,
            timestamp: new Date().toISOString(),
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
      const posthog = getPostHogServer();

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

        posthog.captureException(error, context.userId, {
          context: "groups:get",
          groups: {
            organization: organizationId,
          },
          group_id: input.id,
          trace_id: context.wideEvent.trace_id,
          request_id: context.wideEvent.request_id,
        });

        after(() => {
          posthog.shutdown();
          logger.error("Failed to get group", {
            error,
            user_id: context.user.id,
            organization_id: organizationId,
            group_id: input.id,
            deployment_id: context.wideEvent.deployment_id,
            region: context.wideEvent.region,
            trace_id: context.wideEvent.trace_id,
            request_id: context.wideEvent.request_id,
            timestamp: new Date().toISOString(),
          });
        });

        throw error;
      }
    })
    .route({ method: "GET", path: "/groups/:id" }),

  create: protectedProcedure
    .use(rateLimitMiddleware(10))
    .use(requirePermission({ groups: ["create"] }))
    .input(createGroupSchema)
    .handler(async ({ input, context }) => {
      const organizationId = context.session.activeOrganizationId!;
      const posthog = getPostHogServer();

      try {
        const newGroup = await DB.mutation.groups.createGroup({
          organizationId,
          name: input.name,
          description: input.description,
          defaultMembershipPrice: input.defaultMembershipPrice,
        });

        posthog.capture({
          distinctId: context.userId,
          event: "groups:create",
          groups: {
            organization: organizationId,
          },
          properties: {
            group_id: newGroup.id,
            group_name: newGroup.name,
          },
        });

        after(() => posthog.shutdown());

        return newGroup;
      } catch (error) {
        posthog.captureException(error, context.userId, {
          context: "groups:create",
          groups: {
            organization: organizationId,
          },
          input_name: input.name,
          trace_id: context.wideEvent.trace_id,
          request_id: context.wideEvent.request_id,
        });

        after(() => {
          posthog.shutdown();
          logger.error("Failed to create group", {
            error,
            user_id: context.user.id,
            organization_id: organizationId,
            deployment_id: context.wideEvent.deployment_id,
            region: context.wideEvent.region,
            trace_id: context.wideEvent.trace_id,
            request_id: context.wideEvent.request_id,
            timestamp: new Date().toISOString(),
          });
        });

        throw error;
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
      const posthog = getPostHogServer();

      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined),
      );

      if (Object.keys(cleanUpdates).length === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "No fields to update",
        });
      }

      try {
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

        if (updatedGroup) {
          posthog.capture({
            distinctId: context.userId,
            event: "groups:update",
            groups: {
              organization: organizationId,
            },
            properties: {
              group_id: updatedGroup.id,
              group_name: updatedGroup.name,
            },
          });
        }

        after(() => posthog.shutdown());

        return updatedGroup!;
      } catch (error) {
        if (error instanceof ORPCError) {
          throw error;
        }

        posthog.captureException(error, context.userId, {
          context: "groups:update",
          groups: {
            organization: organizationId,
          },
          group_id: id,
          trace_id: context.wideEvent.trace_id,
          request_id: context.wideEvent.request_id,
        });

        after(() => {
          posthog.shutdown();
          logger.error("Failed to update group", {
            error,
            user_id: context.user.id,
            organization_id: organizationId,
            group_id: id,
            deployment_id: context.wideEvent.deployment_id,
            region: context.wideEvent.region,
            trace_id: context.wideEvent.trace_id,
            request_id: context.wideEvent.request_id,
            timestamp: new Date().toISOString(),
          });
        });

        throw error;
      }
    })
    .route({ method: "PATCH", path: "/groups/:id" }),

  delete: protectedProcedure
    .use(rateLimitMiddleware(10))
    .use(requirePermission({ groups: ["delete"] }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const organizationId = context.session.activeOrganizationId!;
      const posthog = getPostHogServer();

      try {
        const existingGroup = await DB.query.groups.getGroupById({
          groupId: input.id,
        });

        if (!existingGroup || existingGroup.organizationId !== organizationId) {
          throw new ORPCError("NOT_FOUND", {
            message: "Group not found",
          });
        }

        //TODO: 1 query
        const groupMembers = await DB.query.groups.getGroupMemberCount({
          groupId: existingGroup.id,
        });

        if (groupMembers > 0) {
          throw new ORPCError("FORBIDDEN", {
            message: "You cannot delete this Group. It has active Members",
            status: 403,
          });
        }

        const deletedGroup = await DB.mutation.groups.deleteGroup({
          groupId: input.id,
        });

        if (deletedGroup) {
          posthog.capture({
            distinctId: context.userId,
            event: "groups:delete",
            groups: {
              organization: organizationId,
            },
            properties: {
              group_id: deletedGroup.id,
              group_name: deletedGroup.name,
            },
          });
        }

        after(() => posthog.shutdown());

        return deletedGroup!;
      } catch (error) {
        if (error instanceof ORPCError) {
          throw error;
        }

        posthog.captureException(error, context.userId, {
          context: "groups:delete",
          groups: {
            organization: organizationId,
          },
          group_id: input.id,
          trace_id: context.wideEvent.trace_id,
          request_id: context.wideEvent.request_id,
        });

        after(() => {
          posthog.shutdown();
          logger.error("Failed to delete group", {
            error,
            user_id: context.user.id,
            organization_id: organizationId,
            group_id: input.id,
            deployment_id: context.wideEvent.deployment_id,
            region: context.wideEvent.region,
            trace_id: context.wideEvent.trace_id,
            request_id: context.wideEvent.request_id,
            timestamp: new Date().toISOString(),
          });
        });

        throw error;
      }
    })
    .route({ method: "DELETE", path: "/groups/:id" }),
};

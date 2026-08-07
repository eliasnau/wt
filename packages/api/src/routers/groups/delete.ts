import { and, count, eq, transactionDb } from "@matdesk/db";
import { group, groupMember } from "@matdesk/db/schema";
import { createError } from "evlog";

import { groupsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { groupIdInput } from "./schemas";

export const deleteGroup = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ groups: ["delete"] }))
  .input(groupIdInput)
  .handler(async ({ input, context }) => {
    return transactionDb.transaction(async (tx) => {
      const existing = await tx.query.group.findFirst({
        where: (g, { and, eq }) =>
          and(
            eq(g.id, input.id),
            eq(g.organizationId, context.organizationId),
          ),
      });
      if (!existing) {
        throw groupsErrors.NOT_FOUND({
          internal: { groupId: input.id },
        });
      }

      const [memberCount] = await tx
        .select({ count: count() })
        .from(groupMember)
        .where(eq(groupMember.groupId, existing.id));

      if ((memberCount?.count ?? 0) > 0) {
        throw groupsErrors.HAS_ACTIVE_MEMBERS({
          internal: {
            groupId: existing.id,
            memberCount: memberCount?.count,
          },
        });
      }

      const [deleted] = await tx
        .delete(group)
        .where(
          and(
            eq(group.id, existing.id),
            eq(group.organizationId, context.organizationId),
          ),
        )
        .returning();

      if (!deleted) {
        throw createError({
          message: "Couldn't delete group",
          status: 500,
          internal: { reason: "DELETE ... RETURNING produced no row" },
        });
      }

      context.log?.set({
        data: { group: { id: deleted.id, name: deleted.name } },
      });
      return deleted;
    });
  })
  .route({ method: "DELETE", path: "/groups/:id" });

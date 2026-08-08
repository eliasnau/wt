import { db } from "@matdesk/db";
import { groupMember } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { ymdInBerlin } from "../../domain/members/cancellation";
import { groupsErrors, membersErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { databaseIdSchema } from "../../schemas";
import { getGroupById } from "../../queries/groups";
import { getMemberById } from "../../queries/members";

const input = z.object({
  memberId: databaseIdSchema,
  groupId: z.uuid(),
  membershipPriceCents: z.number().int().nonnegative().optional(),
});

export const assignGroup = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ members: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const [member, group] = await Promise.all([
      getMemberById(input.memberId, context.organizationId),
      getGroupById(input.groupId, context.organizationId),
    ]);
    if (!member) {
      throw membersErrors.NOT_FOUND({ internal: { memberId: input.memberId } });
    }
    if (!group) {
      throw groupsErrors.NOT_FOUND({ internal: { groupId: input.groupId } });
    }

    // Default to the group's standard price when the caller doesn't override.
    const price = input.membershipPriceCents ?? group.defaultMembershipPriceCents ?? 0;

    try {
      const [row] = await db
        .insert(groupMember)
        .values({
          memberId: input.memberId,
          groupId: input.groupId,
          membershipPriceCents: price,
          startDate: ymdInBerlin(new Date()),
        })
        .returning();

      if (!row) {
        throw createError({
          message: "Couldn't assign group",
          status: 500,
          internal: { reason: "INSERT groupMember returned no row" },
        });
      }

      context.log?.set({
        data: {
          member: { id: input.memberId },
          group: { id: group.id, name: group.name },
          membership: { priceCents: row.membershipPriceCents },
        },
      });
      return { membership: row, group };
    } catch (error) {
      // 23505 = Postgres unique_violation. Composite PK on (groupId, memberId)
      // means a second assign for the same pair lands here.
      if ((error as { code?: string }).code === "23505") {
        throw membersErrors.ALREADY_IN_GROUP({
          internal: { memberId: input.memberId, groupId: input.groupId },
        });
      }
      throw error;
    }
  })
  .route({ method: "POST", path: "/members/:memberId/groups" });

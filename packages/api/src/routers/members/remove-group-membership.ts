import { and, db, eq, isNull } from "@matdesk/db";
import { groupMember } from "@matdesk/db/schema";
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
});

export const removeGroupMembership = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ member: ["update"] }))
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

    // Close the active spell rather than deleting it — the row stays as
    // history so stats can answer "who was in this group during March?".
    // A future re-assign will create a *new* row.
    const [removed] = await db
      .update(groupMember)
      .set({ endDate: ymdInBerlin(new Date()) })
      .where(
        and(
          eq(groupMember.memberId, input.memberId),
          eq(groupMember.groupId, input.groupId),
          isNull(groupMember.endDate),
        ),
      )
      .returning();

    if (!removed) {
      throw membersErrors.GROUP_MEMBERSHIP_NOT_FOUND({
        internal: { memberId: input.memberId, groupId: input.groupId },
      });
    }

    context.log?.set({
      data: {
        member: { id: input.memberId },
        group: { id: group.id, name: group.name },
      },
    });
    return { membership: removed, group };
  })
  .route({ method: "DELETE", path: "/members/:memberId/groups/:groupId" });

import { and, db, eq, isNull } from "@matdesk/db";
import { groupMember } from "@matdesk/db/schema";
import { z } from "zod";

import { groupsErrors, membersErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { databaseIdSchema } from "../../schemas";
import { getGroupById } from "../../queries/groups";
import { getMemberById } from "../../queries/members";

const input = z.object({
  memberId: databaseIdSchema,
  groupId: z.uuid(),
  // `null` → reset to the group's default price.
  membershipPriceCents: z.number().int().nonnegative().nullable(),
});

export const updateGroupMembership = orgProcedure
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

    const price = input.membershipPriceCents ?? group.defaultMembershipPriceCents ?? 0;

    // Only the currently-active membership row is editable. Historical (closed)
    // spells are immutable — they're the audit trail.
    const [updated] = await db
      .update(groupMember)
      .set({ membershipPriceCents: price })
      .where(
        and(
          eq(groupMember.memberId, input.memberId),
          eq(groupMember.groupId, input.groupId),
          isNull(groupMember.endDate),
        ),
      )
      .returning();

    if (!updated) {
      throw membersErrors.GROUP_MEMBERSHIP_NOT_FOUND({
        internal: { memberId: input.memberId, groupId: input.groupId },
      });
    }

    context.log?.set({
      data: {
        member: { id: input.memberId },
        group: { id: group.id, name: group.name },
        membership: { priceCents: updated.membershipPriceCents },
      },
    });
    return { membership: updated, group };
  })
  .route({ method: "PATCH", path: "/members/:memberId/groups/:groupId" });

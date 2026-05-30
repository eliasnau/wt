import { and, db, eq } from "@matdesk/db";
import { group } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { groupsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getGroupById } from "../../queries/groups";
import { groupColorSchema } from "./schemas";

const input = z.object({
  id: z.uuid(),
  name: z.string().min(1, "Name is required").max(255).optional(),
  description: z.string().max(1000).optional(),
  color: groupColorSchema.optional(),
  // `nullish` lets the caller explicitly clear the default price (send `null`).
  // `undefined` means "no change".
  defaultMembershipPriceCents: z.number().int().nonnegative().nullish(),
});

export const updateGroup = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ groups: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const { id, ...patch } = input;

    // Drop undefined fields so they don't clobber existing values with NULL;
    // an explicit `null` (for `defaultMembershipPriceCents`) is kept.
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(cleanPatch).length === 0) {
      throw groupsErrors.NOTHING_TO_UPDATE();
    }

    const existing = await getGroupById(id, context.organizationId);
    if (!existing) {
      throw groupsErrors.NOT_FOUND({
        internal: { groupId: id, organizationId: context.organizationId },
      });
    }

    const [updated] = await db
      .update(group)
      .set(cleanPatch)
      .where(
        and(
          eq(group.id, id),
          eq(group.organizationId, context.organizationId),
        ),
      )
      .returning();

    if (!updated) {
      throw createError({
        message: "Couldn't update group",
        status: 500,
        internal: { reason: "UPDATE ... RETURNING produced no row" },
      });
    }

    context.log?.set({
      data: { group: { id: updated.id, name: updated.name } },
    });
    return updated;
  })
  .route({ method: "PATCH", path: "/groups/:id" });

import { db } from "@matdesk/db";
import { group } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { groupColorSchema } from "./schemas";

const input = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  color: groupColorSchema,
  defaultMembershipPriceCents: z.number().int().nonnegative().optional(),
  progressionSystemId: z.string().trim().min(1).nullish(),
});

export const createGroup = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ groups: ["create"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    if (input.progressionSystemId) {
      const [system] = await db.query.progressionSystem.findMany({
        where: (table, { and, eq }) =>
          and(
            eq(table.id, input.progressionSystemId!),
            eq(table.organizationId, context.organizationId),
          ),
        limit: 1,
      });
      if (!system) throw createError({ message: "Graduation system not found", status: 404 });
    }
    const [created] = await db
      .insert(group)
      .values({ ...input, organizationId: context.organizationId })
      .returning();

    if (!created) {
      throw createError({
        message: "Couldn't create group",
        status: 500,
        internal: { reason: "INSERT ... RETURNING produced no row" },
      });
    }

    context.log?.set({
      data: { group: { id: created.id, name: created.name } },
    });
    return created;
  })
  .route({ method: "POST", path: "/groups" });

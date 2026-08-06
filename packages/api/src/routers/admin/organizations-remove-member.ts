import { and, db, eq } from "@matdesk/db";
import { member } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { adminProcedure } from "../../index";

const input = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
});

export const removeOrganizationMemberAdmin = adminProcedure
  .meta({ cost: 3 })
  .input(input)
  .handler(async ({ input }) => {
    // Destructure rather than checking `.length` — `noUncheckedIndexedAccess`
    // doesn't narrow `removed[0]` from a length test, and this matches how the
    // other single-row writes in this repo read.
    const [removed] = await db
      .delete(member)
      .where(and(eq(member.organizationId, input.organizationId), eq(member.userId, input.userId)))
      .returning({ id: member.id });

    if (!removed) {
      throw createError({ message: "Mitgliedschaft nicht gefunden", status: 404 });
    }

    return { id: removed.id };
  })
  .route({ method: "POST", path: "/admin/organizations/remove-member" });

import { and, db, desc, eq } from "@matdesk/db";
import { sepaMandate } from "@matdesk/db/schema";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { databaseIdSchema } from "../../schemas";

const input = z.object({
  memberId: databaseIdSchema.optional(),
  contractId: z.uuid().optional(),
});

export const listSepaMandates = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ sepa: ["view"] }))
  .input(input)
  .handler(({ input, context }) => {
    const conditions = [
      eq(sepaMandate.organizationId, context.organizationId),
      input.memberId ? eq(sepaMandate.memberId, input.memberId) : undefined,
      input.contractId ? eq(sepaMandate.contractId, input.contractId) : undefined,
    ].filter((c): c is Exclude<typeof c, undefined> => c !== undefined);

    return db
      .select()
      .from(sepaMandate)
      .where(and(...conditions))
      .orderBy(desc(sepaMandate.createdAt));
  })
  .route({ method: "GET", path: "/billing/sepa-mandates" });

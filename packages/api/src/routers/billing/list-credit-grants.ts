import { and, db, desc, eq } from "@matdesk/db";
import { creditGrant } from "@matdesk/db/schema";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";

const input = z.object({
  memberId: z.uuid().optional(),
  contractId: z.uuid().optional(),
});

export const listCreditGrants = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ member: ["view_payment"] }))
  .input(input)
  .handler(({ input, context }) => {
    const conditions = [
      eq(creditGrant.organizationId, context.organizationId),
      input.memberId ? eq(creditGrant.memberId, input.memberId) : undefined,
      input.contractId ? eq(creditGrant.contractId, input.contractId) : undefined,
    ].filter((c): c is Exclude<typeof c, undefined> => c !== undefined);

    return db
      .select()
      .from(creditGrant)
      .where(and(...conditions))
      .orderBy(desc(creditGrant.createdAt));
  })
  .route({ method: "GET", path: "/billing/credit-grants" });

import { and, db, desc, eq } from "@matdesk/db";
import { creditGrant } from "@matdesk/db/schema";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { databaseIdSchema } from "../../schemas";

const input = z.object({
  memberId: databaseIdSchema.optional(),
  contractId: z.uuid().optional(),
});

export const listCreditGrants = orgProcedure
  .meta({ cost: 1 })
  // `member:view` rather than `view_payment`: credits are surfaced inline on the
  // member detail page, which every member-viewer can already open. Gating them
  // separately meant the card 403'd for exactly the people looking at it.
  .use(requirePermission({ members: ["view"] }))
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

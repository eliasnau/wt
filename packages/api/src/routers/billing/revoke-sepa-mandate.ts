import { and, db, eq } from "@matdesk/db";
import { sepaMandate } from "@matdesk/db/schema";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { idInput } from "./schemas";

export const revokeSepaMandate = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ sepa: ["update"] }))
  .input(idInput)
  .handler(async ({ input, context }) => {
    const [updated] = await db
      .update(sepaMandate)
      .set({ isActive: false, revokedAt: new Date() })
      .where(
        and(eq(sepaMandate.id, input.id), eq(sepaMandate.organizationId, context.organizationId)),
      )
      .returning();
    if (!updated) {
      throw billingErrors.MANDATE_NOT_FOUND({ internal: { mandateId: input.id } });
    }

    context.log?.set({ data: { mandate: { id: updated.id, revoked: true } } });
    return updated;
  })
  .route({ method: "POST", path: "/billing/sepa-mandates/:id/revoke" });

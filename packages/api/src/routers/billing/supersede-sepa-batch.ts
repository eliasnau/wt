import { and, db, eq } from "@matdesk/db";
import { sepaBatch } from "@matdesk/db/schema";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { idInput } from "./schemas";

/** Supersede a downloaded batch (e.g. replaced by a corrected one). */
export const supersedeSepaBatch = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ billing: ["generate"] }))
  .input(idInput)
  .handler(async ({ input, context }) => {
    const [updated] = await db
      .update(sepaBatch)
      .set({ status: "superseded" })
      .where(
        and(
          eq(sepaBatch.id, input.id),
          eq(sepaBatch.organizationId, context.organizationId),
          eq(sepaBatch.status, "downloaded"),
        ),
      )
      .returning();
    if (!updated) {
      throw billingErrors.BATCH_INVALID_STATE({
        internal: { batchId: input.id, expected: "downloaded" },
      });
    }

    context.log?.set({ data: { sepaBatch: { id: updated.id, status: "superseded" } } });
    return updated;
  })
  .route({ method: "POST", path: "/billing/sepa-batches/:id/supersede" });

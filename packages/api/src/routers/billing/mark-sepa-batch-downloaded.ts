import { and, db, eq } from "@matdesk/db";
import { sepaBatch } from "@matdesk/db/schema";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { idInput } from "./schemas";

/** Mark a generated batch downloaded without re-rendering XML. */
export const markSepaBatchDownloaded = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ billing: ["download"] }))
  .input(idInput)
  .handler(async ({ input, context }) => {
    const [updated] = await db
      .update(sepaBatch)
      .set({ status: "downloaded" })
      .where(
        and(
          eq(sepaBatch.id, input.id),
          eq(sepaBatch.organizationId, context.organizationId),
          eq(sepaBatch.status, "generated"),
        ),
      )
      .returning();
    if (!updated) {
      throw billingErrors.BATCH_INVALID_STATE({
        internal: { batchId: input.id, expected: "generated" },
      });
    }

    context.log?.set({ data: { sepaBatch: { id: updated.id, status: "downloaded" } } });
    return updated;
  })
  .route({ method: "POST", path: "/billing/sepa-batches/:id/downloaded" });

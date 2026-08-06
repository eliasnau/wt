import { and, db, eq, or } from "@matdesk/db";
import { sepaBatch } from "@matdesk/db/schema";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { idInput } from "./schemas";

/** Void a generated/downloaded batch (frees its invoices for re-export). */
export const voidSepaBatch = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ billing: ["generate"] }))
  .input(idInput)
  .handler(async ({ input, context }) => {
    const [updated] = await db
      .update(sepaBatch)
      .set({ status: "void" })
      .where(
        and(
          eq(sepaBatch.id, input.id),
          eq(sepaBatch.organizationId, context.organizationId),
          or(eq(sepaBatch.status, "generated"), eq(sepaBatch.status, "downloaded")),
        ),
      )
      .returning();
    if (!updated) {
      throw billingErrors.BATCH_INVALID_STATE({
        internal: { batchId: input.id, expected: "generated|downloaded" },
      });
    }

    context.log?.set({ data: { sepaBatch: { id: updated.id, status: "void" } } });
    return updated;
  })
  .route({ method: "POST", path: "/billing/sepa-batches/:id/void" });

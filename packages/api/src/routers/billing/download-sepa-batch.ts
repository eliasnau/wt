import { and, eq, transactionDb } from "@matdesk/db";
import { sepaBatch } from "@matdesk/db/schema";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { renderSepaBatchXml } from "../../integrations/sepa";
import { requirePermission } from "../../middlewares/permissions";
import { getBatchByIdForUpdate, loadBatchRenderData } from "../../queries/billing";
import { idInput } from "./schemas";

/**
 * Render the batch's pain.008 XML and flip `generated → downloaded` (idempotent
 * for an already-downloaded batch). The batch row is locked `FOR UPDATE` for the
 * whole transaction, so a concurrent void/supersede can't change it between the
 * read, the render, and the status flip — a downloaded batch always corresponds
 * to XML that built successfully.
 */
export const downloadSepaBatch = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ billing: ["download"] }))
  .input(idInput)
  .handler(async ({ input, context }) => {
    const result = await transactionDb.transaction(async (tx) => {
      const batch = await getBatchByIdForUpdate(tx, input.id, context.organizationId);
      if (!batch) {
        throw billingErrors.BATCH_NOT_FOUND({ internal: { batchId: input.id } });
      }
      if (batch.status !== "generated" && batch.status !== "downloaded") {
        throw billingErrors.BATCH_NOT_DOWNLOADABLE({
          internal: { batchId: input.id, status: batch.status },
        });
      }

      const { settingsRow, items, mandatesById } = await loadBatchRenderData(
        tx,
        context.organizationId,
        batch.id,
      );

      const xml = await renderSepaBatchXml({
        batchNumber: batch.batchNumber,
        collectionDate: batch.collectionDate,
        settingsRow,
        items,
        mandatesById,
      });

      let nextBatch = batch;
      if (batch.status === "generated") {
        // We hold the row lock, so this conditional update must affect the row.
        const [updated] = await tx
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
            internal: { batchId: input.id, reason: "status changed concurrently" },
          });
        }
        nextBatch = updated;
      }

      return { batch: nextBatch, xml };
    });

    context.log?.set({
      data: { sepaBatch: { id: result.batch.id, status: result.batch.status } },
    });
    return result;
  })
  .route({ method: "POST", path: "/billing/sepa-batches/:id/download" });

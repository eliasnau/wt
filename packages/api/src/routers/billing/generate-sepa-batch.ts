import { db } from "@matdesk/db";
import { z } from "zod";

import {
  buildBatchNumber,
  partitionEligibleInvoices,
  type PartitionResult,
} from "../../domain/billing/batch";
import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import {
  type BillingExecutor,
  type EligibilityInvoice,
  insertBatchWithItems,
  loadBatchEligibility,
  lockInvoiceIds,
  nextBatchSequenceNumber,
} from "../../queries/billing";
import { ymdSchema } from "./schemas";

const input = z.object({
  collectionDate: ymdSchema,
  notes: z.string().max(1000).optional(),
});

async function partition(
  executor: BillingExecutor,
  organizationId: string,
): Promise<PartitionResult<EligibilityInvoice>> {
  const data = await loadBatchEligibility(executor, organizationId);
  return partitionEligibleInvoices({
    invoices: data.invoices,
    exportedInvoiceIds: data.exportedInvoiceIds,
    mandateIdByContractId: data.mandateIdByContractId,
  });
}

/**
 * Create a SEPA collection batch from the currently-eligible finalized invoices.
 *
 * Eligibility is re-checked *after* locking each round of candidate invoices and
 * loops until the locked set is stable — so an invoice can't slip from eligible
 * to exported between the preview and the insert (TOCTOU-safe). The sequence
 * number is allocated under a per-(org, date) advisory lock.
 */
export const generateSepaBatch = orgProcedure
  .meta({ cost: 10 })
  .use(requirePermission({ billing: ["generate"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const organizationId = context.organizationId;
    const initial = await partition(db, organizationId);

    const { batch, finalPartition } = await db.transaction(async (tx) => {
      const lockedInvoiceIds = new Set<string>();
      let pendingInvoiceIds = initial.included.map((inv) => inv.id);
      let finalPartition = initial;

      while (pendingInvoiceIds.length > 0) {
        await lockInvoiceIds(tx, pendingInvoiceIds);
        for (const id of pendingInvoiceIds) lockedInvoiceIds.add(id);

        finalPartition = await partition(tx, organizationId);
        pendingInvoiceIds = finalPartition.included
          .map((inv) => inv.id)
          .filter((id) => !lockedInvoiceIds.has(id));
      }

      if (finalPartition.included.length === 0) {
        throw billingErrors.NO_ELIGIBLE_INVOICES();
      }

      const sequenceNumber = await nextBatchSequenceNumber(
        tx,
        organizationId,
        input.collectionDate,
      );
      const batchNumber = buildBatchNumber(organizationId, input.collectionDate, sequenceNumber);

      const createdBatch = await insertBatchWithItems(tx, {
        batch: {
          organizationId,
          collectionDate: input.collectionDate,
          sequenceNumber,
          batchNumber,
          status: "generated",
          totalAmountCents: finalPartition.included.reduce((sum, inv) => sum + inv.totalCents, 0),
          transactionCount: finalPartition.included.length,
          notes: input.notes,
        },
        items: finalPartition.included.map((inv) => ({
          organizationId,
          invoiceId: inv.id,
          sepaMandateId: inv.sepaMandateId,
          amountCents: inv.totalCents,
          status: "included",
        })),
      });

      return { batch: createdBatch, finalPartition };
    });

    context.log?.set({
      data: {
        sepaBatch: {
          id: batch.id,
          batchNumber: batch.batchNumber,
          transactionCount: batch.transactionCount,
        },
      },
    });

    return {
      batch,
      includedInvoices: finalPartition.included,
      excludedInvoices: finalPartition.excluded,
    };
  })
  .route({ method: "POST", path: "/billing/sepa-batches" });

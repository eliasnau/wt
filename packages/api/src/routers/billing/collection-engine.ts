import { eq } from "@matdesk/db";
import { sepaBatch } from "@matdesk/db/schema";

import {
  buildBatchNumber,
  partitionEligibleInvoices,
  type PartitionResult,
} from "../../domain/billing/batch";
import { firstDayOfMonth } from "../../domain/billing/dates";
import { billingErrors } from "../../errors";
import { renderSepaBatchXml } from "../../integrations/sepa";
import {
  acquireOrgGenerationLock,
  type BillingTx,
  type EligibilityInvoice,
  insertBatchWithItems,
  loadBatchEligibility,
  loadBatchRenderData,
  lockInvoiceIds,
  nextBatchSequenceNumber,
} from "../../queries/billing";
import { generateInvoicesForMonth } from "./engine";

async function partitionThroughDate(
  tx: BillingTx,
  organizationId: string,
  collectionDate: string,
): Promise<PartitionResult<EligibilityInvoice>> {
  const data = await loadBatchEligibility(tx, organizationId, collectionDate);
  return partitionEligibleInvoices({
    invoices: data.invoices,
    exportedInvoiceIds: data.exportedInvoiceIds,
    mandateIdByContractId: data.mandateIdByContractId,
  });
}

/**
 * Generate missing invoices, create a collection batch, and render its XML in
 * one transaction. A render/configuration failure rolls the complete run back.
 */
export async function prepareSepaCollection(
  tx: BillingTx,
  params: {
    organizationId: string;
    collectionDate: string;
    currency?: string;
  },
) {
  const { organizationId, collectionDate, currency = "EUR" } = params;

  await acquireOrgGenerationLock(tx, organizationId);
  const createdInvoices = await generateInvoicesForMonth(tx, {
    organizationId,
    targetMonth: firstDayOfMonth(collectionDate),
    currency,
  });

  const lockedInvoiceIds = new Set<string>();
  let finalPartition = await partitionThroughDate(tx, organizationId, collectionDate);
  let pendingInvoiceIds = finalPartition.included.map((invoice) => invoice.id);

  while (pendingInvoiceIds.length > 0) {
    await lockInvoiceIds(tx, pendingInvoiceIds);
    for (const id of pendingInvoiceIds) lockedInvoiceIds.add(id);

    finalPartition = await partitionThroughDate(tx, organizationId, collectionDate);
    pendingInvoiceIds = finalPartition.included
      .map((invoice) => invoice.id)
      .filter((id) => !lockedInvoiceIds.has(id));
  }

  if (finalPartition.included.length === 0) {
    throw billingErrors.NO_ELIGIBLE_INVOICES();
  }

  const sequenceNumber = await nextBatchSequenceNumber(tx, organizationId, collectionDate);
  const batchNumber = buildBatchNumber(organizationId, collectionDate, sequenceNumber);
  const generatedBatch = await insertBatchWithItems(tx, {
    batch: {
      organizationId,
      collectionDate,
      sequenceNumber,
      batchNumber,
      status: "generated",
      totalAmountCents: finalPartition.included.reduce(
        (sum, invoice) => sum + invoice.totalCents,
        0,
      ),
      transactionCount: finalPartition.included.length,
    },
    items: finalPartition.included.map((invoice) => ({
      organizationId,
      invoiceId: invoice.id,
      sepaMandateId: invoice.sepaMandateId,
      amountCents: invoice.totalCents,
      status: "included",
    })),
  });

  const { settingsRow, items, mandatesById } = await loadBatchRenderData(
    tx,
    organizationId,
    generatedBatch.id,
  );
  const xml = await renderSepaBatchXml({
    batchNumber,
    collectionDate,
    settingsRow,
    items,
    mandatesById,
  });

  const [batch] = await tx
    .update(sepaBatch)
    .set({ status: "downloaded" })
    .where(eq(sepaBatch.id, generatedBatch.id))
    .returning();
  if (!batch) {
    throw billingErrors.BATCH_INVALID_STATE({
      internal: { batchId: generatedBatch.id, reason: "download transition failed" },
    });
  }

  return {
    batch,
    xml,
    createdInvoiceCount: createdInvoices.length,
    includedInvoices: finalPartition.included,
    excludedInvoices: finalPartition.excluded,
  };
}

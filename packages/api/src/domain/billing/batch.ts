/**
 * Pure SEPA-batch helpers: the human batch number, and the decision of which
 * finalized invoices are eligible for a collection batch. The DB reads (invoices,
 * exported-invoice ids, active mandates) live in the query layer; this just
 * partitions the data.
 */

const ACTIVE_BATCH_STATUSES = new Set(["generated", "downloaded"]);

/** Whether a batch status counts as an active export (locks its invoices). */
export function isActiveBatchStatus(status: string): boolean {
  return ACTIVE_BATCH_STATUSES.has(status);
}

/** `YYYY-MM-DD-NN-XXXXXXXX` — collection date, 2-digit sequence, org prefix. */
export function buildBatchNumber(
  organizationId: string,
  collectionDate: string,
  sequenceNumber: number,
): string {
  return `${collectionDate}-${String(sequenceNumber).padStart(2, "0")}-${organizationId.slice(0, 8).toUpperCase()}`;
}

export type EligibleInvoice = {
  id: string;
  contractId: string;
  totalCents: number;
};

export type ExclusionReason = "already_exported" | "missing_active_mandate";

export type PartitionResult<T extends EligibleInvoice> = {
  included: Array<T & { sepaMandateId: string }>;
  excluded: Array<T & { reason: ExclusionReason }>;
};

/**
 * Split finalized, positive-total invoices into those that can go into a batch
 * and those that can't. An invoice is excluded if it's already in an active
 * batch, or if its contract has no active mandate. Order is preserved.
 */
export function partitionEligibleInvoices<T extends EligibleInvoice>(params: {
  invoices: T[];
  exportedInvoiceIds: ReadonlySet<string>;
  mandateIdByContractId: ReadonlyMap<string, string>;
}): PartitionResult<T> {
  const { invoices, exportedInvoiceIds, mandateIdByContractId } = params;
  const included: Array<T & { sepaMandateId: string }> = [];
  const excluded: Array<T & { reason: ExclusionReason }> = [];

  for (const invoice of invoices) {
    if (exportedInvoiceIds.has(invoice.id)) {
      excluded.push({ ...invoice, reason: "already_exported" });
      continue;
    }
    const sepaMandateId = mandateIdByContractId.get(invoice.contractId);
    if (!sepaMandateId) {
      excluded.push({ ...invoice, reason: "missing_active_mandate" });
      continue;
    }
    included.push({ ...invoice, sepaMandateId });
  }

  return { included, excluded };
}

/**
 * Billing data access: reads, write helpers, and the advisory locks that make
 * generation/export safe under concurrency. Pure decisions live in
 * `domain/billing/*`; this module only talks to Postgres.
 *
 * Executors: most helpers accept `db` or a transaction handle so the same query
 * runs inside or outside a transaction. Lock + write helpers require a tx.
 */

import { and, asc, db, eq, gte, inArray, isNull, lte, or, sql, transactionDb } from "@matdesk/db";
import {
  clubMember,
  contract,
  creditGrant,
  group,
  groupMember,
  invoice,
  invoiceLine,
  organizationSettings,
  sepaBatch,
  sepaBatchItem,
  sepaMandate,
} from "@matdesk/db/schema";

import { cycleKeyForMonth } from "../domain/billing/cycle";
import { firstDayOfMonth } from "../domain/billing/dates";
import type { CreditGrantForAllocation, GrantUpdate } from "../domain/billing/credits";
import type { GroupCharge, InvoiceLineDraft } from "../domain/billing/lines";
import type { SepaRenderItem, SepaRenderMandate } from "../integrations/sepa";

export type BillingTx = Parameters<Parameters<typeof transactionDb.transaction>[0]>[0];
export type BillingExecutor = typeof db | typeof transactionDb | BillingTx;

type ContractRow = typeof contract.$inferSelect;
type InvoiceRow = typeof invoice.$inferSelect;

const ACTIVE_BATCH_STATUSES = ["generated", "downloaded"] as const;

// ─── Advisory locks (xact-scoped; released on commit/rollback) ───────────────

/**
 * Take a transaction-scoped advisory lock on a string key. Uses `hashtextextended`
 * (64-bit) rather than `hashtext` (32-bit) so accidental cross-key collisions —
 * one org/invoice blocking an unrelated one — are practically impossible. Keys
 * are namespaced by prefix (`billing:generateInvoices:`, `invoice:`, …) so the
 * lock spaces of different operations never overlap.
 */
async function advisoryXactLock(tx: BillingTx, key: string): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
}

/** Serializes invoice generation per organization. */
export async function acquireOrgGenerationLock(
  tx: BillingTx,
  organizationId: string,
): Promise<void> {
  await advisoryXactLock(tx, `billing:generateInvoices:${organizationId}`);
}

/** Serializes mandate changes for one contract (no two active mandates). */
export async function acquireContractMandateLock(tx: BillingTx, contractId: string): Promise<void> {
  await advisoryXactLock(tx, `billing:mandate:contract:${contractId}`);
}

/** Locks specific invoices (sorted, deduped) to prevent concurrent void/export. */
export async function lockInvoiceIds(tx: BillingTx, invoiceIds: string[]): Promise<void> {
  const unique = Array.from(new Set(invoiceIds)).sort();
  for (const invoiceId of unique) {
    await advisoryXactLock(tx, `billing:invoice:${invoiceId}`);
  }
}

/** Locks the (org, collectionDate) sequence space and returns the next number. */
export async function nextBatchSequenceNumber(
  tx: BillingTx,
  organizationId: string,
  collectionDate: string,
): Promise<number> {
  await advisoryXactLock(tx, `billing:batchSeq:${organizationId}:${collectionDate}`);
  const [row] = await tx
    .select({
      maxSequence: sql<number>`COALESCE(MAX(${sepaBatch.sequenceNumber}), 0)::int`,
    })
    .from(sepaBatch)
    .where(
      and(
        eq(sepaBatch.organizationId, organizationId),
        eq(sepaBatch.collectionDate, collectionDate),
      ),
    );
  return (row?.maxSequence ?? 0) + 1;
}

// ─── Reads for invoice generation ────────────────────────────────────────────

export async function loadOrgContracts(
  tx: BillingExecutor,
  organizationId: string,
): Promise<ContractRow[]> {
  return tx.select().from(contract).where(eq(contract.organizationId, organizationId));
}

/** Current (active-spell) group membership charges for a member. Arrears are
 *  priced from current memberships — historical snapshots are not kept. */
export async function loadGroupCharges(
  tx: BillingExecutor,
  memberId: string,
): Promise<GroupCharge[]> {
  const rows = await tx
    .select({
      groupId: groupMember.groupId,
      groupName: group.name,
      membershipPriceCents: groupMember.membershipPriceCents,
    })
    .from(groupMember)
    .innerJoin(group, eq(group.id, groupMember.groupId))
    .where(and(eq(groupMember.memberId, memberId), isNull(groupMember.endDate)))
    .orderBy(asc(group.name));
  return rows;
}

/** All billing months already covered by a non-void invoice for this contract.
 *  A superset of the planner's window is fine — it only filters its own months. */
export async function loadContractNonVoidMonths(
  tx: BillingExecutor,
  contractId: string,
): Promise<Set<string>> {
  const rows = await tx
    .select({ billingPeriodStart: invoice.billingPeriodStart })
    .from(invoice)
    .where(and(eq(invoice.contractId, contractId), sql`${invoice.status} <> 'void'`));
  return new Set(rows.map((r) => r.billingPeriodStart));
}

/** Yearly-fee cycle keys already billed (non-void yearly_fee lines), seeded for
 *  the planner so it never double-bills a cycle. */
export async function loadBilledYearlyCycles(
  tx: BillingExecutor,
  contractRow: Pick<ContractRow, "id" | "startDate" | "yearlyFeeMode">,
): Promise<Set<string>> {
  const rows = await tx
    .select({ coverageStart: invoiceLine.coverageStart })
    .from(invoiceLine)
    .innerJoin(invoice, eq(invoice.id, invoiceLine.invoiceId))
    .where(
      and(
        eq(invoice.contractId, contractRow.id),
        eq(invoiceLine.type, "yearly_fee"),
        sql`${invoice.status} <> 'void'`,
      ),
    );

  const cycles = new Set<string>();
  for (const row of rows) {
    if (!row.coverageStart) continue;
    cycles.add(
      cycleKeyForMonth(firstDayOfMonth(row.coverageStart), {
        yearlyFeeMode: contractRow.yearlyFeeMode,
        startDate: contractRow.startDate,
      }),
    );
  }
  return cycles;
}

/** Whether the yearly fee for the cycle containing `asOf` has already been
 *  billed — used to lock `yearlyFeeCents` edits once the fee is on an invoice. */
export async function hasYearlyFeeBeenBilled(
  executor: BillingExecutor,
  contractRow: Pick<ContractRow, "id" | "startDate" | "yearlyFeeMode">,
  asOf: string,
): Promise<boolean> {
  const billed = await loadBilledYearlyCycles(executor, contractRow);
  const currentCycle = cycleKeyForMonth(firstDayOfMonth(asOf), {
    yearlyFeeMode: contractRow.yearlyFeeMode,
    startDate: contractRow.startDate,
  });
  return billed.has(currentCycle);
}

/** Credit grants valid for the given month, oldest-first. */
export async function loadActiveCreditGrants(
  tx: BillingExecutor,
  params: {
    organizationId: string;
    memberId: string;
    contractId: string;
    monthStart: string;
  },
): Promise<CreditGrantForAllocation[]> {
  return tx
    .select({
      id: creditGrant.id,
      type: creditGrant.type,
      remainingCycles: creditGrant.remainingCycles,
      remainingAmountCents: creditGrant.remainingAmountCents,
    })
    .from(creditGrant)
    .where(
      and(
        eq(creditGrant.organizationId, params.organizationId),
        eq(creditGrant.memberId, params.memberId),
        eq(creditGrant.contractId, params.contractId),
        // Revoked grants are excluded from allocation but keep their history.
        isNull(creditGrant.revokedAt),
        or(isNull(creditGrant.validFrom), lte(creditGrant.validFrom, params.monthStart)),
        or(isNull(creditGrant.expiresAt), gte(creditGrant.expiresAt, params.monthStart)),
      ),
    )
    .orderBy(asc(creditGrant.createdAt));
}

// ─── Writes ──────────────────────────────────────────────────────────────────

/**
 * Insert an invoice and its lines, then finalize it with the summed total.
 * Returns the finalized invoice row. Runs inside the caller's transaction.
 */
export async function insertFinalizedInvoice(
  tx: BillingTx,
  params: {
    invoice: typeof invoice.$inferInsert;
    lines: InvoiceLineDraft[];
  },
): Promise<InvoiceRow> {
  const [created] = await tx.insert(invoice).values(params.invoice).returning();
  if (!created) {
    throw new Error("INSERT invoice returned no row");
  }

  if (params.lines.length > 0) {
    await tx
      .insert(invoiceLine)
      .values(params.lines.map((line) => ({ ...line, invoiceId: created.id })));
  }

  const totalCents = params.lines.reduce((sum, line) => sum + line.totalAmountCents, 0);
  const [finalized] = await tx
    .update(invoice)
    .set({ status: "finalized", totalCents, finalizedAt: new Date() })
    .where(eq(invoice.id, created.id))
    .returning();
  if (!finalized) {
    throw new Error("UPDATE invoice (finalize) returned no row");
  }
  return finalized;
}

/** Apply credit-grant deltas (`remaining = remaining + delta`). */
export async function applyGrantUpdates(tx: BillingTx, updates: GrantUpdate[]): Promise<void> {
  for (const update of updates) {
    if (update.remainingCyclesDelta !== undefined) {
      await tx
        .update(creditGrant)
        .set({
          remainingCycles: sql`${creditGrant.remainingCycles} + ${update.remainingCyclesDelta}`,
        })
        .where(eq(creditGrant.id, update.grantId));
    }
    if (update.remainingAmountCentsDelta !== undefined) {
      await tx
        .update(creditGrant)
        .set({
          remainingAmountCents: sql`${creditGrant.remainingAmountCents} + ${update.remainingAmountCentsDelta}`,
        })
        .where(eq(creditGrant.id, update.grantId));
    }
  }
}

export async function setJoiningFeePaid(
  tx: BillingTx,
  contractId: string,
  joiningFeePaid: boolean,
): Promise<void> {
  await tx.update(contract).set({ joiningFeePaid }).where(eq(contract.id, contractId));
}

// ─── Invoice reads (procedures) ──────────────────────────────────────────────

export async function getInvoiceById(
  executor: BillingExecutor,
  invoiceId: string,
  organizationId: string,
): Promise<InvoiceRow | undefined> {
  const [row] = await executor
    .select()
    .from(invoice)
    .where(and(eq(invoice.id, invoiceId), eq(invoice.organizationId, organizationId)))
    .limit(1);
  return row;
}

export async function getInvoiceLines(executor: BillingExecutor, invoiceId: string) {
  return executor
    .select()
    .from(invoiceLine)
    .where(eq(invoiceLine.invoiceId, invoiceId))
    .orderBy(asc(invoiceLine.createdAt));
}

/** Whether the invoice sits in an active (generated/downloaded) SEPA batch. */
export async function invoiceIsExported(
  executor: BillingExecutor,
  invoiceId: string,
): Promise<boolean> {
  const rows = await executor
    .select({ status: sepaBatch.status })
    .from(sepaBatchItem)
    .innerJoin(sepaBatch, eq(sepaBatch.id, sepaBatchItem.sepaBatchId))
    .where(eq(sepaBatchItem.invoiceId, invoiceId));
  return rows.some((row) => (ACTIVE_BATCH_STATUSES as readonly string[]).includes(row.status));
}

export async function ensureOwnedMemberContract(
  executor: BillingExecutor,
  organizationId: string,
  memberId: string,
  contractId: string,
): Promise<boolean> {
  const [row] = await executor
    .select({ id: contract.id })
    .from(contract)
    .innerJoin(clubMember, eq(clubMember.id, contract.memberId))
    .where(
      and(
        eq(contract.id, contractId),
        eq(contract.memberId, memberId),
        eq(contract.organizationId, organizationId),
        eq(clubMember.organizationId, organizationId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

// ─── SEPA batch eligibility + render data ────────────────────────────────────

export type EligibilityInvoice = {
  id: string;
  memberId: string;
  contractId: string;
  totalCents: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  memberFirstName: string;
  memberLastName: string;
};

export type BatchEligibilityData = {
  invoices: EligibilityInvoice[];
  exportedInvoiceIds: Set<string>;
  mandateIdByContractId: Map<string, string>;
};

/** All inputs the pure `partitionEligibleInvoices` needs, in three queries. */
export async function loadBatchEligibility(
  executor: BillingExecutor,
  organizationId: string,
  throughDate?: string,
): Promise<BatchEligibilityData> {
  const invoices = await executor
    .select({
      id: invoice.id,
      memberId: invoice.memberId,
      contractId: invoice.contractId,
      totalCents: invoice.totalCents,
      billingPeriodStart: invoice.billingPeriodStart,
      billingPeriodEnd: invoice.billingPeriodEnd,
      memberFirstName: clubMember.firstName,
      memberLastName: clubMember.lastName,
    })
    .from(invoice)
    .innerJoin(clubMember, eq(clubMember.id, invoice.memberId))
    .where(
      and(
        eq(invoice.organizationId, organizationId),
        eq(invoice.status, "finalized"),
        sql`${invoice.totalCents} > 0`,
        throughDate ? lte(invoice.billingPeriodStart, throughDate) : undefined,
      ),
    )
    .orderBy(asc(invoice.billingPeriodStart), asc(clubMember.lastName), asc(clubMember.firstName));

  const exportedRows = await executor
    .select({ invoiceId: sepaBatchItem.invoiceId, status: sepaBatch.status })
    .from(sepaBatchItem)
    .innerJoin(sepaBatch, eq(sepaBatch.id, sepaBatchItem.sepaBatchId))
    .where(eq(sepaBatchItem.organizationId, organizationId));
  const exportedInvoiceIds = new Set(
    exportedRows
      .filter((row) => (ACTIVE_BATCH_STATUSES as readonly string[]).includes(row.status))
      .map((row) => row.invoiceId),
  );

  const mandates = await executor
    .select({ contractId: sepaMandate.contractId, id: sepaMandate.id })
    .from(sepaMandate)
    .where(
      and(
        eq(sepaMandate.organizationId, organizationId),
        eq(sepaMandate.isActive, true),
        isNull(sepaMandate.revokedAt),
      ),
    );
  const mandateIdByContractId = new Map(mandates.map((row) => [row.contractId, row.id]));

  return { invoices, exportedInvoiceIds, mandateIdByContractId };
}

export async function getBatchById(
  executor: BillingExecutor,
  batchId: string,
  organizationId: string,
) {
  const [row] = await executor
    .select()
    .from(sepaBatch)
    .where(and(eq(sepaBatch.id, batchId), eq(sepaBatch.organizationId, organizationId)))
    .limit(1);
  return row;
}

/** Like {@link getBatchById} but takes a `FOR UPDATE` row lock — used by the
 *  download flow so a concurrent void/supersede can't change the batch between
 *  the read and the status transition. */
export async function getBatchByIdForUpdate(
  tx: BillingTx,
  batchId: string,
  organizationId: string,
) {
  const [row] = await tx
    .select()
    .from(sepaBatch)
    .where(and(eq(sepaBatch.id, batchId), eq(sepaBatch.organizationId, organizationId)))
    .for("update")
    .limit(1);
  return row;
}

export async function insertBatchWithItems(
  tx: BillingTx,
  params: {
    batch: typeof sepaBatch.$inferInsert;
    items: Array<Omit<typeof sepaBatchItem.$inferInsert, "sepaBatchId">>;
  },
) {
  const [createdBatch] = await tx.insert(sepaBatch).values(params.batch).returning();
  if (!createdBatch) {
    throw new Error("INSERT sepa_batch returned no row");
  }
  if (params.items.length > 0) {
    await tx
      .insert(sepaBatchItem)
      .values(params.items.map((item) => ({ ...item, sepaBatchId: createdBatch.id })));
  }
  return createdBatch;
}

/**
 * Batch + creditor settings + included items for XML render. Mandates are keyed
 * by the **batch item's stored `sepaMandateId`** (the mandate selected when the
 * batch was generated), so the export is immutable — swapping a member's mandate
 * afterwards can't silently change which account is debited. Revoked/inactive
 * stored mandates are excluded, so they surface as a missing-mandate error
 * rather than collecting on a withdrawn authorization.
 */
export async function loadBatchRenderData(
  executor: BillingExecutor,
  organizationId: string,
  batchId: string,
): Promise<{
  settingsRow: typeof organizationSettings.$inferSelect | undefined;
  items: SepaRenderItem[];
  mandatesById: Map<string, SepaRenderMandate>;
}> {
  const [settingsRow] = await executor
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);

  const items = await executor
    .select({
      invoiceId: sepaBatchItem.invoiceId,
      amountCents: sepaBatchItem.amountCents,
      sepaMandateId: sepaBatchItem.sepaMandateId,
      contractId: invoice.contractId,
      memberFirstName: clubMember.firstName,
      memberLastName: clubMember.lastName,
      billingPeriodStart: invoice.billingPeriodStart,
    })
    .from(sepaBatchItem)
    .innerJoin(invoice, eq(invoice.id, sepaBatchItem.invoiceId))
    .innerJoin(clubMember, eq(clubMember.id, invoice.memberId))
    .where(
      and(
        eq(sepaBatchItem.organizationId, organizationId),
        eq(sepaBatchItem.sepaBatchId, batchId),
        eq(sepaBatchItem.status, "included"),
      ),
    )
    .orderBy(asc(clubMember.lastName), asc(clubMember.firstName));

  const mandateIds = Array.from(new Set(items.map((item) => item.sepaMandateId)));
  const mandatesById = new Map<string, SepaRenderMandate>();
  if (mandateIds.length > 0) {
    const mandates = await executor
      .select({
        id: sepaMandate.id,
        iban: sepaMandate.iban,
        bic: sepaMandate.bic,
        mandateReference: sepaMandate.mandateReference,
        signatureDate: sepaMandate.signatureDate,
      })
      .from(sepaMandate)
      .where(
        and(
          eq(sepaMandate.organizationId, organizationId),
          eq(sepaMandate.isActive, true),
          isNull(sepaMandate.revokedAt),
          inArray(sepaMandate.id, mandateIds),
        ),
      );
    for (const mandate of mandates) {
      mandatesById.set(mandate.id, {
        iban: mandate.iban,
        bic: mandate.bic,
        mandateReference: mandate.mandateReference,
        signatureDate: mandate.signatureDate,
      });
    }
  }

  return { settingsRow, items, mandatesById };
}

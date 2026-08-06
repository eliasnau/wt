/**
 * The billing planner — the heart of invoice generation, made pure.
 *
 * Given one contract, a target month, and what's already been billed, it decides
 * exactly which month-invoices to produce and what each charges. All DB reads
 * happen in the orchestrator; this function is total and deterministic, so every
 * rule below is unit-tested without a database.
 *
 * ## Rules (faithful to the wt engine)
 *
 * 1. Only `active`/`cancelled` contracts bill. A contract bills from the month
 *    after `settledThroughDate` (or its start), through the target month — or
 *    through its cancellation month if cancelled before the target.
 * 2. Months already covered by a non-void invoice are skipped (**idempotent**:
 *    re-running generation for the same target produces nothing new).
 * 3. Of the *missing* months: the target month is the **current** invoice; the
 *    single most-recent missed historical month becomes **collectible arrears**;
 *    every older missed month is **waived** (a net-zero invoice kept for the
 *    record). This caps catch-up at one arrears month instead of stacking debt.
 * 4. The **joining fee** lands only on the current invoice, only if unpaid and
 *    > 0.
 * 5. The **yearly fee** is charged once per cycle (Jan-mode = calendar year,
 *    anniversary-mode = anchored window). The first emitted missing month in a
 *    cycle that hits the trigger month consumes it — **even if that month is
 *    waived** (matching wt; the fee then isn't collected that cycle).
 * 6. A month produces an invoice only if it has at least one charge (a
 *    membership line, the joining fee, or the yearly fee).
 */

import { addMonths, firstDayOfMonth } from "./dates";
import { cycleKeyForMonth, isYearlyTriggerMonth } from "./cycle";

/** Contract statuses that participate in billing (cancelled still owes arrears). */
const BILLABLE_STATUSES = new Set(["active", "cancelled"]);

export type ContractForPlan = {
  status: string;
  /** `YYYY-MM-01` */
  startDate: string;
  /** `YYYY-MM-DD` or null */
  settledThroughDate: string | null;
  /** `YYYY-MM-DD` or null */
  cancellationEffectiveDate: string | null;
  joiningFeePaid: boolean;
  joiningFeeCents: number | null;
  yearlyFeeCents: number | null;
  yearlyFeeMode: string;
};

export type BillingRole = "current" | "arrears" | "waived";

export type PlannedInvoice = {
  month: string;
  role: BillingRole;
  chargeJoiningFee: boolean;
  chargeYearlyFee: boolean;
};

export function planContractBilling(params: {
  contract: ContractForPlan;
  /** `YYYY-MM-01` */
  targetMonth: string;
  /** Billing months (`YYYY-MM-01`) already covered by a non-void invoice. */
  existingMonths: ReadonlySet<string>;
  /** Yearly cycle keys already billed (from existing non-void yearly_fee lines). */
  billedYearlyCycles: ReadonlySet<string>;
  /** Whether the member currently has any group membership charges. */
  hasMembershipCharges: boolean;
}): { invoices: PlannedInvoice[] } {
  const { contract, targetMonth, existingMonths, billedYearlyCycles, hasMembershipCharges } =
    params;

  if (!BILLABLE_STATUSES.has(contract.status)) {
    return { invoices: [] };
  }

  // Not started yet.
  if (contract.startDate > targetMonth) {
    return { invoices: [] };
  }

  const settledThroughMonth = contract.settledThroughDate
    ? addMonths(firstDayOfMonth(contract.settledThroughDate), 1)
    : contract.startDate;
  const firstBillableMonth =
    settledThroughMonth > contract.startDate ? settledThroughMonth : contract.startDate;

  // Cancelled contracts stop billing at their effective cancellation month.
  const lastBillableMonth =
    contract.cancellationEffectiveDate && contract.cancellationEffectiveDate < targetMonth
      ? firstDayOfMonth(contract.cancellationEffectiveDate)
      : targetMonth;

  if (firstBillableMonth > lastBillableMonth) {
    return { invoices: [] };
  }

  const monthsToConsider: string[] = [];
  for (
    let cursor = firstBillableMonth;
    cursor <= lastBillableMonth;
    cursor = addMonths(cursor, 1)
  ) {
    monthsToConsider.push(cursor);
  }

  const missingMonths = monthsToConsider.filter((month) => !existingMonths.has(month));
  if (missingMonths.length === 0) {
    return { invoices: [] };
  }

  const historicalMissed = missingMonths.filter((month) => month < targetMonth);
  const collectibleArrearsMonth =
    historicalMissed.length > 0 ? historicalMissed[historicalMissed.length - 1] : undefined;

  // Copy so we can evolve it as the run consumes cycles.
  const billedCycles = new Set(billedYearlyCycles);
  const joiningFeeCents = contract.joiningFeeCents ?? 0;
  const yearlyFeeCents = contract.yearlyFeeCents ?? 0;

  const invoices: PlannedInvoice[] = [];

  for (const month of missingMonths) {
    const role: BillingRole =
      month === targetMonth ? "current" : month === collectibleArrearsMonth ? "arrears" : "waived";

    const chargeJoiningFee = role === "current" && !contract.joiningFeePaid && joiningFeeCents > 0;

    let chargeYearlyFee = false;
    if (yearlyFeeCents > 0 && isYearlyTriggerMonth(month, contract)) {
      const cycleKey = cycleKeyForMonth(month, contract);
      if (!billedCycles.has(cycleKey)) {
        chargeYearlyFee = true;
        billedCycles.add(cycleKey);
      }
    }

    const hasAnyCharge = hasMembershipCharges || chargeJoiningFee || chargeYearlyFee;
    if (!hasAnyCharge) {
      continue;
    }

    invoices.push({ month, role, chargeJoiningFee, chargeYearlyFee });
  }

  return { invoices };
}

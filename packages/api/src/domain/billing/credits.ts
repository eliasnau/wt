/**
 * Pure credit allocation.
 *
 * Two phases, faithful to the wt engine:
 *   1. **Billing-cycle credits** ("free months") offset only `membership_fee`
 *      lines — never arrears. One cycle covers the whole month's membership.
 *   2. **Money credits** then offset any remaining positive balance, oldest
 *      grant first, partial allowed.
 *
 * The function never mutates its inputs. It returns the negative credit lines to
 * append and the grant deltas to persist; the orchestrator applies the deltas
 * with `SET remaining = remaining + delta` (concurrency-safe). Restoring credits
 * on void/replace is the inverse (`creditRestorations`).
 *
 * All amounts are integer cents.
 */

import { lastDayOfMonth } from "./dates";
import type { InvoiceLineDraft } from "./lines";
import { sumLines } from "./lines";

export type CreditGrantForAllocation = {
  id: string;
  type: string; // "money" | "billing_cycles"
  remainingCycles: number | null;
  remainingAmountCents: number | null;
};

/** A delta to apply to a credit grant. Exactly one of the two fields is set. */
export type GrantUpdate = {
  grantId: string;
  remainingCyclesDelta?: number;
  remainingAmountCentsDelta?: number;
};

export type CreditAllocation = {
  creditLines: InvoiceLineDraft[];
  grantUpdates: GrantUpdate[];
};

/**
 * Allocate credits against the invoice's positive balance. `grants` must already
 * be filtered for validity (validFrom/expiresAt) and ordered oldest-first by the
 * caller; this function applies them deterministically in that order.
 */
export function allocateCredits(params: {
  organizationId: string;
  monthStart: string;
  lines: InvoiceLineDraft[];
  grants: CreditGrantForAllocation[];
}): CreditAllocation {
  const { organizationId, monthStart, lines, grants } = params;

  let balance = sumLines(lines);
  if (balance <= 0) {
    return { creditLines: [], grantUpdates: [] };
  }

  const coverageEnd = lastDayOfMonth(monthStart);
  const creditLines: InvoiceLineDraft[] = [];
  const grantUpdates: GrantUpdate[] = [];

  // Phase 1 — billing-cycle credits offset membership_fee lines only.
  const membershipTotal = lines
    .filter((line) => line.type === "membership_fee")
    .reduce((sum, line) => sum + line.totalAmountCents, 0);

  for (const grant of grants) {
    if (balance <= 0) break;
    if (grant.type !== "billing_cycles" || (grant.remainingCycles ?? 0) <= 0) {
      continue;
    }

    const appliedCycleCredits = creditLines
      .filter((line) => line.type === "credit_cycle")
      .reduce((sum, line) => sum + line.totalAmountCents, 0);
    const remainingMembershipTotal = Math.max(0, membershipTotal + appliedCycleCredits);
    if (remainingMembershipTotal <= 0) continue;

    creditLines.push({
      organizationId,
      type: "credit_cycle",
      description: "Billing cycle credit applied",
      quantity: 1,
      unitAmountCents: -remainingMembershipTotal,
      totalAmountCents: -remainingMembershipTotal,
      coverageStart: monthStart,
      coverageEnd,
      creditGrantId: grant.id,
    });
    balance -= remainingMembershipTotal;
    grantUpdates.push({ grantId: grant.id, remainingCyclesDelta: -1 });
  }

  if (balance <= 0) {
    return { creditLines, grantUpdates };
  }

  // Phase 2 — money credits offset any remaining balance.
  for (const grant of grants) {
    if (balance <= 0) break;
    if (grant.type !== "money" || (grant.remainingAmountCents ?? 0) <= 0) {
      continue;
    }

    const amountToApply = Math.min(balance, grant.remainingAmountCents ?? 0);
    if (amountToApply <= 0) continue;

    creditLines.push({
      organizationId,
      type: "credit_money",
      description: "Money credit applied",
      quantity: 1,
      unitAmountCents: -amountToApply,
      totalAmountCents: -amountToApply,
      coverageStart: monthStart,
      coverageEnd,
      creditGrantId: grant.id,
    });
    balance -= amountToApply;
    grantUpdates.push({
      grantId: grant.id,
      remainingAmountCentsDelta: -amountToApply,
    });
  }

  return { creditLines, grantUpdates };
}

/**
 * Inverse of allocation: given an invoice's lines, the grant deltas to restore
 * when the invoice is voided/replaced. Money credits give back their amount;
 * cycle credits give back one cycle. Non-credit lines and lines without a grant
 * are ignored.
 */
export function creditRestorations(
  lines: Array<{
    type: string;
    totalAmountCents: number;
    creditGrantId: string | null;
  }>,
): GrantUpdate[] {
  const updates: GrantUpdate[] = [];
  for (const line of lines) {
    if (!line.creditGrantId) continue;
    if (line.type === "credit_money") {
      updates.push({
        grantId: line.creditGrantId,
        remainingAmountCentsDelta: Math.abs(line.totalAmountCents),
      });
    } else if (line.type === "credit_cycle") {
      updates.push({ grantId: line.creditGrantId, remainingCyclesDelta: 1 });
    }
  }
  return updates;
}

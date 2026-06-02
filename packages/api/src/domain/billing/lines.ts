/**
 * Pure invoice-line construction for a single planned month.
 *
 * Produces the charge lines (membership per group, optional joining/yearly fee)
 * and then applies the month's role:
 *   - `current`  → lines as-is (the collectible invoice).
 *   - `arrears`  → membership lines become `arrears`; all lines relabeled.
 *   - `waived`   → each positive line is mirrored by a negative `waiver` line,
 *                  so the invoice nets to zero but records what was forgiven.
 *
 * All amounts are integer cents. No DB.
 */

import { lastDayOfMonth, monthLabel } from "./dates";
import type { BillingRole } from "./plan";

export type InvoiceLineType =
  | "membership_fee"
  | "arrears"
  | "joining_fee"
  | "yearly_fee"
  | "waiver"
  | "credit_money"
  | "credit_cycle";

/** An invoice line without its `invoiceId` (assigned at insert time). */
export type InvoiceLineDraft = {
  organizationId: string;
  type: InvoiceLineType;
  description: string;
  quantity: number;
  unitAmountCents: number;
  totalAmountCents: number;
  coverageStart: string | null;
  coverageEnd: string | null;
  groupId?: string | null;
  creditGrantId?: string | null;
};

export type GroupCharge = {
  groupId: string;
  groupName: string;
  membershipPriceCents: number;
};

type ContractForLines = {
  joiningFeeCents: number | null;
  yearlyFeeCents: number | null;
  yearlyFeeMode: string;
};

/** Sum of line totals (stays in integer cents). */
export function sumLines(lines: InvoiceLineDraft[]): number {
  return lines.reduce((sum, line) => sum + line.totalAmountCents, 0);
}

function buildBaseLines(params: {
  organizationId: string;
  contract: ContractForLines;
  month: string;
  groupCharges: GroupCharge[];
  chargeJoiningFee: boolean;
  chargeYearlyFee: boolean;
}): InvoiceLineDraft[] {
  const { organizationId, contract, month, groupCharges } = params;
  const coverageEnd = lastDayOfMonth(month);
  const lines: InvoiceLineDraft[] = [];

  for (const charge of groupCharges) {
    lines.push({
      organizationId,
      type: "membership_fee",
      description: `Membership fee: ${charge.groupName}`,
      quantity: 1,
      unitAmountCents: charge.membershipPriceCents,
      totalAmountCents: charge.membershipPriceCents,
      coverageStart: month,
      coverageEnd,
      groupId: charge.groupId,
    });
  }

  if (params.chargeJoiningFee && (contract.joiningFeeCents ?? 0) > 0) {
    lines.push({
      organizationId,
      type: "joining_fee",
      description: "Joining fee",
      quantity: 1,
      unitAmountCents: contract.joiningFeeCents ?? 0,
      totalAmountCents: contract.joiningFeeCents ?? 0,
      coverageStart: month,
      coverageEnd,
    });
  }

  if (params.chargeYearlyFee && (contract.yearlyFeeCents ?? 0) > 0) {
    lines.push({
      organizationId,
      type: "yearly_fee",
      description:
        contract.yearlyFeeMode === "anniversary"
          ? "Annual fee (anniversary)"
          : "Annual fee (January)",
      quantity: 1,
      unitAmountCents: contract.yearlyFeeCents ?? 0,
      totalAmountCents: contract.yearlyFeeCents ?? 0,
      coverageStart: month,
      coverageEnd,
    });
  }

  return lines;
}

/**
 * Build the lines for one planned month, with role applied. Returns `[]` when
 * the month has no charges (the caller then emits no invoice).
 */
export function buildMonthLines(params: {
  organizationId: string;
  contract: ContractForLines;
  month: string;
  role: BillingRole;
  groupCharges: GroupCharge[];
  chargeJoiningFee: boolean;
  chargeYearlyFee: boolean;
}): InvoiceLineDraft[] {
  const baseLines = buildBaseLines(params);
  if (baseLines.length === 0) return [];

  const { organizationId, month, role } = params;
  const label = monthLabel(month);

  if (role === "waived") {
    const lines = [...baseLines];
    for (const line of baseLines) {
      lines.push({
        organizationId,
        type: "waiver",
        description: `Waived charge for ${label}: ${line.description}`,
        quantity: 1,
        unitAmountCents: -line.totalAmountCents,
        totalAmountCents: -line.totalAmountCents,
        coverageStart: line.coverageStart,
        coverageEnd: line.coverageEnd,
        groupId: line.groupId,
      });
    }
    return lines;
  }

  if (role === "arrears") {
    return baseLines.map((line) => ({
      ...line,
      type: line.type === "membership_fee" ? "arrears" : line.type,
      description: `Arrears for ${label}: ${line.description}`,
    }));
  }

  return baseLines;
}

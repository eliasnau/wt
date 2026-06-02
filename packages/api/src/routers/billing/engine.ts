/**
 * The invoice-generation orchestrator, separated from the procedure wrapper so
 * it can be driven directly (e.g. integration tests) without pulling in the
 * auth/middleware chain. Pure decisions live in `domain/billing/*`; this loads
 * data, materializes planned lines, applies credits, and writes — all inside the
 * caller's transaction.
 */

import { allocateCredits } from "../../domain/billing/credits";
import { lastDayOfMonth } from "../../domain/billing/dates";
import { buildMonthLines } from "../../domain/billing/lines";
import { planContractBilling } from "../../domain/billing/plan";
import {
  applyGrantUpdates,
  type BillingTx,
  insertFinalizedInvoice,
  loadActiveCreditGrants,
  loadBilledYearlyCycles,
  loadContractNonVoidMonths,
  loadGroupCharges,
  loadOrgContracts,
  setJoiningFeePaid,
} from "../../queries/billing";

export async function generateInvoicesForMonth(
  tx: BillingTx,
  params: { organizationId: string; targetMonth: string; currency: string },
) {
  const { organizationId, targetMonth, currency } = params;
  const contracts = await loadOrgContracts(tx, organizationId);
  const createdInvoices = [];

  for (const contractRow of contracts) {
    const groupCharges = await loadGroupCharges(tx, contractRow.memberId);
    const existingMonths = await loadContractNonVoidMonths(tx, contractRow.id);
    const billedYearlyCycles = await loadBilledYearlyCycles(tx, contractRow);

    const { invoices } = planContractBilling({
      contract: contractRow,
      targetMonth,
      existingMonths,
      billedYearlyCycles,
      hasMembershipCharges: groupCharges.length > 0,
    });

    for (const planned of invoices) {
      const lines = buildMonthLines({
        organizationId,
        contract: contractRow,
        month: planned.month,
        role: planned.role,
        groupCharges,
        chargeJoiningFee: planned.chargeJoiningFee,
        chargeYearlyFee: planned.chargeYearlyFee,
      });
      if (lines.length === 0) continue;

      // Credits apply only to collectible invoices (current/arrears), never to
      // net-zero waiver invoices.
      if (planned.role !== "waived") {
        const grants = await loadActiveCreditGrants(tx, {
          organizationId,
          memberId: contractRow.memberId,
          contractId: contractRow.id,
          monthStart: planned.month,
        });
        const { creditLines, grantUpdates } = allocateCredits({
          organizationId,
          monthStart: planned.month,
          lines,
          grants,
        });
        lines.push(...creditLines);
        await applyGrantUpdates(tx, grantUpdates);
      }

      const finalized = await insertFinalizedInvoice(tx, {
        invoice: {
          organizationId,
          memberId: contractRow.memberId,
          contractId: contractRow.id,
          billingPeriodStart: planned.month,
          billingPeriodEnd: lastDayOfMonth(planned.month),
          status: "draft",
          currency,
        },
        lines,
      });

      if (planned.chargeJoiningFee) {
        await setJoiningFeePaid(tx, contractRow.id, true);
      }

      createdInvoices.push(finalized);
    }
  }

  return createdInvoices;
}

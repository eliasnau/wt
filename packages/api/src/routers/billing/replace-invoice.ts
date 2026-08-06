import { db, eq } from "@matdesk/db";
import { invoice } from "@matdesk/db/schema";
import { z } from "zod";

import { allocateCredits, creditRestorations } from "../../domain/billing/credits";
import type { InvoiceLineDraft, InvoiceLineType } from "../../domain/billing/lines";
import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import {
  applyGrantUpdates,
  getInvoiceById,
  getInvoiceLines,
  insertFinalizedInvoice,
  invoiceIsExported,
  loadActiveCreditGrants,
  lockInvoiceIds,
} from "../../queries/billing";

const input = z.object({
  id: z.uuid(),
  reason: z.string().min(1).max(1000),
});

const CREDIT_TYPES = new Set<InvoiceLineType>(["credit_money", "credit_cycle"]);

/**
 * Void an invoice and re-issue it. Existing credit lines are stripped and
 * recalculated; all other lines (including waivers and any joining fee) carry
 * forward — so unlike `voidInvoice`, replacing does NOT make the joining fee
 * payable again. One transaction, invoice-locked, never touches exported invoices.
 */
export const replaceInvoice = orgProcedure
  .meta({ cost: 10 })
  .use(requirePermission({ billing: ["generate"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const replacement = await db.transaction(async (tx) => {
      await lockInvoiceIds(tx, [input.id]);

      if (await invoiceIsExported(tx, input.id)) {
        throw billingErrors.INVOICE_EXPORTED({ internal: { invoiceId: input.id } });
      }

      const current = await getInvoiceById(tx, input.id, context.organizationId);
      if (!current) {
        throw billingErrors.INVOICE_NOT_FOUND({ internal: { invoiceId: input.id } });
      }
      if (current.status === "void") {
        throw billingErrors.INVOICE_ALREADY_VOID({ internal: { invoiceId: input.id } });
      }

      const currentLines = await getInvoiceLines(tx, input.id);

      await tx
        .update(invoice)
        .set({ status: "void", voidReason: input.reason })
        .where(eq(invoice.id, input.id));
      await applyGrantUpdates(tx, creditRestorations(currentLines));

      // Carry every non-credit line forward; credits are recomputed below.
      const chargeLines: InvoiceLineDraft[] = currentLines
        .filter((line) => !CREDIT_TYPES.has(line.type as InvoiceLineType))
        .map((line) => ({
          organizationId: context.organizationId,
          type: line.type as InvoiceLineType,
          description: line.description,
          quantity: line.quantity,
          unitAmountCents: line.unitAmountCents,
          totalAmountCents: line.totalAmountCents,
          coverageStart: line.coverageStart,
          coverageEnd: line.coverageEnd,
          groupId: line.groupId,
        }));

      const grants = await loadActiveCreditGrants(tx, {
        organizationId: context.organizationId,
        memberId: current.memberId,
        contractId: current.contractId,
        monthStart: current.billingPeriodStart,
      });
      const { creditLines, grantUpdates } = allocateCredits({
        organizationId: context.organizationId,
        monthStart: current.billingPeriodStart,
        lines: chargeLines,
        grants,
      });
      chargeLines.push(...creditLines);
      await applyGrantUpdates(tx, grantUpdates);

      const created = await insertFinalizedInvoice(tx, {
        invoice: {
          organizationId: context.organizationId,
          memberId: current.memberId,
          contractId: current.contractId,
          billingPeriodStart: current.billingPeriodStart,
          billingPeriodEnd: current.billingPeriodEnd,
          status: "draft",
          currency: current.currency,
        },
        lines: chargeLines,
      });

      await tx
        .update(invoice)
        .set({ replacedByInvoiceId: created.id })
        .where(eq(invoice.id, current.id));

      return created;
    });

    context.log?.set({
      data: { invoice: { id: replacement.id, replaces: input.id } },
    });
    return replacement;
  })
  .route({ method: "POST", path: "/billing/invoices/:id/replace" });

import { db, eq } from "@matdesk/db";
import { invoice } from "@matdesk/db/schema";
import { z } from "zod";

import { creditRestorations } from "../../domain/billing/credits";
import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import {
  applyGrantUpdates,
  getInvoiceById,
  getInvoiceLines,
  invoiceIsExported,
  lockInvoiceIds,
  setJoiningFeePaid,
} from "../../queries/billing";

const input = z.object({
  id: z.uuid(),
  reason: z.string().min(1).max(1000),
});

export const voidInvoice = orgProcedure
  .meta({ cost: 10 })
  .use(requirePermission({ billing: ["generate"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const voided = await db.transaction(async (tx) => {
      await lockInvoiceIds(tx, [input.id]);

      if (await invoiceIsExported(tx, input.id)) {
        throw billingErrors.INVOICE_EXPORTED({ internal: { invoiceId: input.id } });
      }

      const invoiceRow = await getInvoiceById(tx, input.id, context.organizationId);
      if (!invoiceRow) {
        throw billingErrors.INVOICE_NOT_FOUND({ internal: { invoiceId: input.id } });
      }
      if (invoiceRow.status === "void") {
        throw billingErrors.INVOICE_ALREADY_VOID({ internal: { invoiceId: input.id } });
      }

      const lines = await getInvoiceLines(tx, input.id);

      const [updated] = await tx
        .update(invoice)
        .set({ status: "void", voidReason: input.reason })
        .where(eq(invoice.id, input.id))
        .returning();
      if (!updated) {
        throw billingErrors.INVOICE_NOT_FOUND({ internal: { invoiceId: input.id } });
      }

      // Voiding a joining-fee invoice makes the fee payable again; restore any
      // credits the invoice had consumed.
      if (lines.some((line) => line.type === "joining_fee")) {
        await setJoiningFeePaid(tx, invoiceRow.contractId, false);
      }
      await applyGrantUpdates(tx, creditRestorations(lines));

      return updated;
    });

    context.log?.set({ data: { invoice: { id: voided.id, status: "void" } } });
    return voided;
  })
  .route({ method: "POST", path: "/billing/invoices/:id/void" });

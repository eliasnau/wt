import { db, desc, eq } from "@matdesk/db";
import { sepaBatch, sepaBatchItem, sepaMandate } from "@matdesk/db/schema";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getInvoiceById, getInvoiceLines } from "../../queries/billing";
import { idInput } from "./schemas";

export const getInvoice = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ billing: ["view"] }))
  .input(idInput)
  .handler(async ({ input, context }) => {
    const invoiceRow = await getInvoiceById(db, input.id, context.organizationId);
    if (!invoiceRow) {
      throw billingErrors.INVOICE_NOT_FOUND({
        internal: { invoiceId: input.id, organizationId: context.organizationId },
      });
    }

    const lines = await getInvoiceLines(db, input.id);

    const batchItems = await db
      .select({
        id: sepaBatchItem.id,
        sepaBatchId: sepaBatchItem.sepaBatchId,
        status: sepaBatchItem.status,
        amountCents: sepaBatchItem.amountCents,
        batchStatus: sepaBatch.status,
        batchNumber: sepaBatch.batchNumber,
        collectionDate: sepaBatch.collectionDate,
        mandateReference: sepaMandate.mandateReference,
      })
      .from(sepaBatchItem)
      .innerJoin(sepaBatch, eq(sepaBatch.id, sepaBatchItem.sepaBatchId))
      .innerJoin(sepaMandate, eq(sepaMandate.id, sepaBatchItem.sepaMandateId))
      .where(eq(sepaBatchItem.invoiceId, input.id))
      .orderBy(desc(sepaBatch.createdAt));

    context.log?.set({ data: { invoice: { id: invoiceRow.id } } });
    return { invoice: invoiceRow, lines, sepaBatchItems: batchItems };
  })
  .route({ method: "GET", path: "/billing/invoices/:id" });

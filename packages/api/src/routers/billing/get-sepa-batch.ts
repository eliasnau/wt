import { asc, db, eq } from "@matdesk/db";
import { clubMember, invoice, sepaBatchItem, sepaMandate } from "@matdesk/db/schema";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getBatchById } from "../../queries/billing";
import { idInput } from "./schemas";

export const getSepaBatch = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ billing: ["view"] }))
  .input(idInput)
  .handler(async ({ input, context }) => {
    const batch = await getBatchById(db, input.id, context.organizationId);
    if (!batch) {
      throw billingErrors.BATCH_NOT_FOUND({ internal: { batchId: input.id } });
    }

    // The mandate reference comes from the mandate the item recorded at
    // generation time, not whatever is currently active for the contract.
    const items = await db
      .select({
        id: sepaBatchItem.id,
        invoiceId: sepaBatchItem.invoiceId,
        amountCents: sepaBatchItem.amountCents,
        status: sepaBatchItem.status,
        contractId: invoice.contractId,
        memberFirstName: clubMember.firstName,
        memberLastName: clubMember.lastName,
        billingPeriodStart: invoice.billingPeriodStart,
        billingPeriodEnd: invoice.billingPeriodEnd,
        mandateReference: sepaMandate.mandateReference,
      })
      .from(sepaBatchItem)
      .innerJoin(invoice, eq(invoice.id, sepaBatchItem.invoiceId))
      .innerJoin(clubMember, eq(clubMember.id, invoice.memberId))
      .innerJoin(sepaMandate, eq(sepaMandate.id, sepaBatchItem.sepaMandateId))
      .where(eq(sepaBatchItem.sepaBatchId, input.id))
      .orderBy(asc(clubMember.lastName), asc(clubMember.firstName));

    return { batch, items };
  })
  .route({ method: "GET", path: "/billing/sepa-batches/:id" });

import { db } from "@matdesk/db";
import { z } from "zod";

import { partitionEligibleInvoices } from "../../domain/billing/batch";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { loadBatchEligibility } from "../../queries/billing";

export const previewSepaBatch = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ billing: ["view"] }))
  .input(z.object({}))
  .handler(async ({ context }) => {
    const data = await loadBatchEligibility(db, context.organizationId);
    const { included, excluded } = partitionEligibleInvoices({
      invoices: data.invoices,
      exportedInvoiceIds: data.exportedInvoiceIds,
      mandateIdByContractId: data.mandateIdByContractId,
    });
    return { includedInvoices: included, excludedInvoices: excluded };
  })
  .route({ method: "GET", path: "/billing/sepa-batches/preview" });

import { transactionDb } from "@matdesk/db";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { acquireOrgGenerationLock } from "../../queries/billing";
import { generateInvoicesForMonth } from "./engine";
import { monthStartSchema } from "./schemas";

const input = z.object({
  targetMonth: monthStartSchema,
  currency: z.string().default("EUR"),
});

/**
 * Generate the month's invoices for the whole organization.
 *
 * The entire run is one transaction guarded by a per-org advisory lock, so it is
 * **atomic** (a throw rolls back every invoice) and **serialized** (no two runs
 * race). Re-running for the same month produces nothing new (idempotent).
 */
export const generateInvoices = orgProcedure
  .meta({ cost: 10 })
  .use(requirePermission({ billing: ["generate"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const createdInvoices = await transactionDb.transaction(async (tx) => {
      await acquireOrgGenerationLock(tx, context.organizationId);
      return generateInvoicesForMonth(tx, {
        organizationId: context.organizationId,
        targetMonth: input.targetMonth,
        currency: input.currency,
      });
    });

    context.log?.set({
      data: {
        billing: {
          targetMonth: input.targetMonth,
          createdCount: createdInvoices.length,
        },
      },
    });

    return {
      targetMonth: input.targetMonth,
      createdCount: createdInvoices.length,
      invoices: createdInvoices,
    };
  })
  .route({ method: "POST", path: "/billing/invoices/generate" });

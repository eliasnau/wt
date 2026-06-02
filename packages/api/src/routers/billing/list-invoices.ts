import { and, db, desc, eq, gte, lte } from "@matdesk/db";
import { clubMember, invoice } from "@matdesk/db/schema";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { invoiceStatusSchema, ymdSchema } from "./schemas";

const input = z.object({
  memberId: z.uuid().optional(),
  contractId: z.uuid().optional(),
  status: invoiceStatusSchema.optional(),
  from: ymdSchema.optional(),
  to: ymdSchema.optional(),
});

export const listInvoices = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ billing: ["view"] }))
  .input(input)
  .handler(({ input, context }) => {
    const conditions = [
      eq(invoice.organizationId, context.organizationId),
      input.memberId ? eq(invoice.memberId, input.memberId) : undefined,
      input.contractId ? eq(invoice.contractId, input.contractId) : undefined,
      input.status ? eq(invoice.status, input.status) : undefined,
      input.from ? gte(invoice.billingPeriodStart, input.from) : undefined,
      input.to ? lte(invoice.billingPeriodStart, input.to) : undefined,
    ].filter((c): c is Exclude<typeof c, undefined> => c !== undefined);

    return db
      .select({
        id: invoice.id,
        memberId: invoice.memberId,
        contractId: invoice.contractId,
        billingPeriodStart: invoice.billingPeriodStart,
        billingPeriodEnd: invoice.billingPeriodEnd,
        status: invoice.status,
        totalCents: invoice.totalCents,
        currency: invoice.currency,
        createdAt: invoice.createdAt,
        finalizedAt: invoice.finalizedAt,
        memberFirstName: clubMember.firstName,
        memberLastName: clubMember.lastName,
      })
      .from(invoice)
      .innerJoin(clubMember, eq(clubMember.id, invoice.memberId))
      .where(and(...conditions))
      .orderBy(desc(invoice.billingPeriodStart), desc(invoice.createdAt));
  })
  .route({ method: "GET", path: "/billing/invoices" });

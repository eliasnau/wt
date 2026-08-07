import { and, count, db, desc, eq, gte, ilike, lte, or, sql, type SQL } from "@matdesk/db";
import { clubMember, invoice } from "@matdesk/db/schema";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { databaseIdSchema } from "../../schemas";
import { invoiceStatusSchema, ymdSchema } from "./schemas";

const input = z.object({
  memberId: databaseIdSchema.optional(),
  contractId: z.uuid().optional(),
  status: invoiceStatusSchema.optional(),
  from: ymdSchema.optional(),
  to: ymdSchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const listInvoices = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ billing: ["view"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const searchPattern = input.search ? `%${input.search}%` : undefined;
    const conditions = [
      eq(invoice.organizationId, context.organizationId),
      input.memberId ? eq(invoice.memberId, input.memberId) : undefined,
      input.contractId ? eq(invoice.contractId, input.contractId) : undefined,
      input.status ? eq(invoice.status, input.status) : undefined,
      input.from ? gte(invoice.billingPeriodStart, input.from) : undefined,
      input.to ? lte(invoice.billingPeriodStart, input.to) : undefined,
      searchPattern
        ? or(
            ilike(clubMember.firstName, searchPattern),
            ilike(clubMember.lastName, searchPattern),
            sql`${invoice.id}::text ILIKE ${searchPattern}`,
            sql`concat(${clubMember.firstName}, ' ', ${clubMember.lastName}) ILIKE ${searchPattern}`,
          )
        : undefined,
    ].filter((condition): condition is SQL => condition !== undefined);

    const where = and(...conditions);
    const offset = (input.page - 1) * input.limit;

    const [rows, [totalRow]] = await Promise.all([
      db
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
        .where(where)
        .orderBy(desc(invoice.billingPeriodStart), desc(invoice.createdAt))
        .limit(input.limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(invoice)
        .innerJoin(clubMember, eq(clubMember.id, invoice.memberId))
        .where(where),
    ]);

    const totalCount = totalRow?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / input.limit));

    return {
      data: rows,
      pagination: {
        page: input.page,
        limit: input.limit,
        totalCount,
        totalPages,
        hasPreviousPage: input.page > 1,
        hasNextPage: input.page < totalPages,
      },
    };
  })
  .route({ method: "GET", path: "/billing/invoices" });

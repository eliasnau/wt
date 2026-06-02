import { count, db, desc, ilike, or, sql } from "@matdesk/db";
import { member, organization } from "@matdesk/db/schema";
import { z } from "zod";

import { adminProcedure } from "../../index";

const input = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listOrganizationsAdmin = adminProcedure
  .meta({ cost: 2 })
  .input(input)
  .handler(async ({ input }) => {
    const { page, limit } = input;
    const search = input.search?.trim();
    const where = search
      ? or(ilike(organization.name, `%${search}%`), ilike(organization.slug, `%${search}%`))
      : undefined;

    const memberCount = sql<number>`(
      SELECT COUNT(*) FROM ${member} WHERE ${member.organizationId} = ${organization.id}
    )`;

    const [rows, totalRow] = await Promise.all([
      db
        .select({ org: organization, memberCount })
        .from(organization)
        .where(where)
        .orderBy(desc(organization.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: count() })
        .from(organization)
        .where(where)
        .then((r) => r[0]),
    ]);

    const totalCount = totalRow?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: rows.map((r) => ({ ...r.org, memberCount: Number(r.memberCount) })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  })
  .route({ method: "POST", path: "/admin/organizations/list" });

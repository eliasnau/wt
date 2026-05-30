import {
  and,
  count,
  db,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "@matdesk/db";
import { clubMember, contract, groupMember } from "@matdesk/db/schema";
import { z } from "zod";

import { ymdInBerlin } from "../../domain/members/cancellation";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { loadGroupMembershipsByMember } from "../../queries/members";

/**
 * The three buckets are mutually exclusive at the row level:
 *  - `active`               — contract has never been cancelled
 *  - `cancelled_but_active` — cancellation scheduled but not yet effective
 *  - `cancelled`            — cancellation has taken effect (member is gone)
 *
 * Pass any subset to show those statuses. Omit `statuses` (or pass an empty
 * array) to apply no status filter (show all three).
 */
const STATUSES = ["active", "cancelled_but_active", "cancelled"] as const;
type MemberStatus = (typeof STATUSES)[number];

const input = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  groupIds: z.array(z.string()).optional(),
  options: z
    .object({
      statuses: z.array(z.enum(STATUSES)).optional(),
    })
    .optional(),
});

function statusPredicate(status: MemberStatus, today: string): SQL {
  switch (status) {
    case "active":
      return sql`${contract.cancelledAt} IS NULL`;
    case "cancelled_but_active":
      return sql`${contract.cancelledAt} IS NOT NULL
                 AND (${contract.cancellationEffectiveDate} IS NULL
                      OR ${contract.cancellationEffectiveDate} >= ${today})`;
    case "cancelled":
      return sql`${contract.cancelledAt} IS NOT NULL
                 AND ${contract.cancellationEffectiveDate} IS NOT NULL
                 AND ${contract.cancellationEffectiveDate} < ${today}`;
  }
}

export const listMembers = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ member: ["view"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const { page, limit } = input;
    const today = ymdInBerlin(new Date());

    const rawSearch = input.search?.trim();
    const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

    const groupIds = input.groupIds
      ?.map((g) => g.trim())
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);

    // Caller asked for a group filter but provided no usable ids → no results.
    if (
      (input.groupIds?.length ?? 0) > 0 &&
      (!groupIds || groupIds.length === 0)
    ) {
      return emptyPage(page, limit);
    }

    // Empty / undefined statuses → no filter (show all three buckets).
    const statuses = input.options?.statuses
      ? [...new Set(input.options.statuses)]
      : [];
    const statusFilter =
      statuses.length === 0 || statuses.length === STATUSES.length
        ? undefined
        : or(...statuses.map((s) => statusPredicate(s, today)));

    const whereExpr = and(
      eq(clubMember.organizationId, context.organizationId),
      search
        ? or(
            ilike(clubMember.firstName, `%${search}%`),
            ilike(clubMember.lastName, `%${search}%`),
            ilike(sql`CAST(${clubMember.birthdate} AS TEXT)`, `%${search}%`),
            ilike(clubMember.email, `%${search}%`),
            ilike(clubMember.phone, `%${search}%`),
            ilike(
              sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
              `%${search}%`,
            ),
          )
        : undefined,
      // Match members with a *currently active* membership in any of the
      // requested groups. Without `endDate IS NULL` here, historical
      // memberships would qualify and surface members who've left.
      groupIds?.length
        ? sql`${clubMember.id} IN (
              SELECT ${groupMember.memberId}
              FROM ${groupMember}
              WHERE ${inArray(groupMember.groupId, groupIds)}
                AND ${groupMember.endDate} IS NULL
            )`
        : undefined,
      statusFilter,
    );

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          member: clubMember,
          contract: contract,
        })
        .from(clubMember)
        .innerJoin(contract, eq(contract.memberId, clubMember.id))
        .where(whereExpr)
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: count() })
        .from(clubMember)
        .innerJoin(contract, eq(contract.memberId, clubMember.id))
        .where(whereExpr)
        .then((r) => r[0]),
    ]);

    const totalCount = totalRow?.count ?? 0;
    const groupsByMember = await loadGroupMembershipsByMember(
      rows.map((r) => r.member.id),
    );

    const totalPages = Math.ceil(totalCount / limit);
    context.log?.set({
      data: { query: { resultCount: rows.length, totalCount } },
    });

    return {
      data: rows.map(({ member, contract: contractRow }) => ({
        ...member,
        contract: contractRow,
        groupMembers: groupsByMember.get(member.id) ?? [],
      })),
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
  .route({ method: "GET", path: "/members" });

function emptyPage(page: number, limit: number) {
  return {
    data: [] as Array<never>,
    pagination: {
      page,
      limit,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    },
  };
}

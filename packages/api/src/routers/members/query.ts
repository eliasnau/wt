import { and, count, db, eq, ilike, inArray, or, sql, type SQL } from "@matdesk/db";
import { clubMember, contract, groupMember } from "@matdesk/db/schema";
import { z } from "zod";

import { ymdInBerlin } from "../../domain/members/cancellation";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { databaseIdSchema } from "../../schemas";
import { loadGroupMembershipsByMember } from "../../queries/members";

// ─── Filterable field set ────────────────────────────────────────────────────
//
// Every field the generic `filters[]` array can reference. Includes both
// member columns, contract columns, and one computed value (`groupCount`).
const FILTER_FIELDS = [
  // Member text
  "firstName",
  "lastName",
  "fullName",
  "email",
  "phone",
  "street",
  "city",
  "state",
  "postalCode",
  "country",
  "notes",
  "guardianName",
  "guardianEmail",
  "guardianPhone",
  // Dates
  "birthdate",
  "startDate",
  "cancellationEffectiveDate",
  "cancelledAt",
  // Contract text
  "initialPeriod",
  "cancelReason",
  // Numeric
  "joiningFeeCents",
  "yearlyFeeCents",
  "groupCount",
] as const;
type FilterField = (typeof FILTER_FIELDS)[number];

const NUMERIC_FIELDS = new Set<FilterField>(["joiningFeeCents", "yearlyFeeCents", "groupCount"]);

// ─── Status filter ───────────────────────────────────────────────────────────
const STATUSES = ["active", "cancelled_but_active", "cancelled"] as const;
type MemberStatus = (typeof STATUSES)[number];

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

// ─── Sort fields ─────────────────────────────────────────────────────────────
const SORT_EXPRS = {
  createdAt: clubMember.createdAt,
  updatedAt: clubMember.updatedAt,
  firstName: clubMember.firstName,
  lastName: clubMember.lastName,
  fullName: sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
  birthdate: clubMember.birthdate,
  email: clubMember.email,
  city: clubMember.city,
  startDate: contract.startDate,
  cancellationEffectiveDate: contract.cancellationEffectiveDate,
  cancelledAt: contract.cancelledAt,
  joiningFeeCents: contract.joiningFeeCents,
  yearlyFeeCents: contract.yearlyFeeCents,
};
const SORT_FIELDS = Object.keys(SORT_EXPRS) as Array<keyof typeof SORT_EXPRS>;
type SortField = (typeof SORT_FIELDS)[number];

// ─── Filter clause schema ────────────────────────────────────────────────────
//
// Generic field/op/value tuple. The op governs the SQL operator; `value` is
// always serialised as a string (parsed to a number for numeric fields).
const filterClauseSchema = z.union([
  z.object({
    field: z.enum(FILTER_FIELDS),
    operator: z.enum(["contains", "startsWith", "endsWith", "eq", "neq", "gte", "lte"]),
    value: z.string().min(1),
  }),
  z.object({
    field: z.enum(FILTER_FIELDS),
    operator: z.literal("in"),
    value: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    field: z.enum(FILTER_FIELDS),
    operator: z.enum(["isNull", "isNotNull"]),
  }),
]);

// ─── Field SQL expressions ───────────────────────────────────────────────────
//
// Each field exposes:
//   - `compare`: the expression used by `=` / `<>` / `>=` / `<=` / IN / IS NULL
//   - `text`:    the expression used by `ilike` (cast to text where needed)
//
// Return type intentionally inferred — Drizzle's Column and SQL types both
// implement SQLWrapper but aren't mutually assignable, so an explicit
// annotation would over-narrow.
function getFieldExprs(field: FilterField) {
  switch (field) {
    case "firstName":
      return { compare: clubMember.firstName, text: clubMember.firstName };
    case "lastName":
      return { compare: clubMember.lastName, text: clubMember.lastName };
    case "fullName": {
      const expr = sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`;
      return { compare: expr, text: expr };
    }
    case "email":
      return { compare: clubMember.email, text: clubMember.email };
    case "phone":
      return { compare: clubMember.phone, text: clubMember.phone };
    case "street":
      return { compare: clubMember.street, text: clubMember.street };
    case "city":
      return { compare: clubMember.city, text: clubMember.city };
    case "state":
      return { compare: clubMember.state, text: clubMember.state };
    case "postalCode":
      return { compare: clubMember.postalCode, text: clubMember.postalCode };
    case "country":
      return { compare: clubMember.country, text: clubMember.country };
    case "notes":
      return { compare: clubMember.notes, text: clubMember.notes };
    case "guardianName":
      return { compare: clubMember.guardianName, text: clubMember.guardianName };
    case "guardianEmail":
      return {
        compare: clubMember.guardianEmail,
        text: clubMember.guardianEmail,
      };
    case "guardianPhone":
      return {
        compare: clubMember.guardianPhone,
        text: clubMember.guardianPhone,
      };
    case "birthdate":
      return {
        compare: clubMember.birthdate,
        text: sql`CAST(${clubMember.birthdate} AS TEXT)`,
      };
    case "startDate":
      return {
        compare: contract.startDate,
        text: sql`CAST(${contract.startDate} AS TEXT)`,
      };
    case "cancellationEffectiveDate":
      return {
        compare: contract.cancellationEffectiveDate,
        text: sql`CAST(${contract.cancellationEffectiveDate} AS TEXT)`,
      };
    case "cancelledAt":
      return {
        compare: contract.cancelledAt,
        text: sql`CAST(${contract.cancelledAt} AS TEXT)`,
      };
    case "initialPeriod":
      return { compare: contract.initialPeriod, text: contract.initialPeriod };
    case "cancelReason":
      return {
        compare: contract.cancellationReason,
        text: contract.cancellationReason,
      };
    case "joiningFeeCents":
      return {
        compare: contract.joiningFeeCents,
        text: sql`CAST(${contract.joiningFeeCents} AS TEXT)`,
      };
    case "yearlyFeeCents":
      return {
        compare: contract.yearlyFeeCents,
        text: sql`CAST(${contract.yearlyFeeCents} AS TEXT)`,
      };
    case "groupCount": {
      // Count of *currently active* group memberships for the row's member.
      const expr = sql<number>`(
        SELECT COUNT(*)
        FROM ${groupMember}
        WHERE ${groupMember.memberId} = ${clubMember.id}
          AND ${groupMember.endDate} IS NULL
      )`;
      return { compare: expr, text: sql`CAST(${expr} AS TEXT)` };
    }
  }
}

function parseNumericOrFalse(raw: string): number | null {
  if (!/^-?\d+$/.test(raw)) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function buildFilterClause(filter: z.infer<typeof filterClauseSchema>): SQL {
  const { compare, text } = getFieldExprs(filter.field);
  const isNumeric = NUMERIC_FIELDS.has(filter.field);

  switch (filter.operator) {
    case "contains":
      return ilike(text, `%${filter.value}%`);
    case "startsWith":
      return ilike(text, `${filter.value}%`);
    case "endsWith":
      return ilike(text, `%${filter.value}`);
    case "isNull":
      return sql`${compare} IS NULL`;
    case "isNotNull":
      return sql`${compare} IS NOT NULL`;
    case "in": {
      if (isNumeric) {
        const nums = filter.value.map(parseNumericOrFalse).filter((n): n is number => n !== null);
        if (nums.length === 0) return sql`FALSE`;
        return sql`${compare} IN (${sql.join(
          nums.map((n) => sql`${n}`),
          sql`, `,
        )})`;
      }
      return sql`${compare} IN (${sql.join(
        filter.value.map((v) => sql`${v}`),
        sql`, `,
      )})`;
    }
    case "eq":
    case "neq":
    case "gte":
    case "lte": {
      const opSql =
        filter.operator === "eq"
          ? sql`=`
          : filter.operator === "neq"
            ? sql`<>`
            : filter.operator === "gte"
              ? sql`>=`
              : sql`<=`;
      if (isNumeric) {
        const n = parseNumericOrFalse(filter.value);
        if (n === null) return sql`FALSE`;
        return sql`${compare} ${opSql} ${n}`;
      }
      return sql`${compare} ${opSql} ${filter.value}`;
    }
  }
}

// ─── Group filter (mode-aware) ───────────────────────────────────────────────
function groupFilterExpr(groups: { mode: "any" | "all" | "none"; ids: string[] }): SQL | undefined {
  if (groups.ids.length === 0) return undefined;
  const idsList = sql.join(
    groups.ids.map((id) => sql`${id}`),
    sql`, `,
  );
  const exists = sql`EXISTS (
    SELECT 1 FROM ${groupMember}
    WHERE ${groupMember.memberId} = ${clubMember.id}
      AND ${groupMember.groupId} IN (${idsList})
      AND ${groupMember.endDate} IS NULL
  )`;
  switch (groups.mode) {
    case "any":
      return exists;
    case "none":
      return sql`NOT ${exists}`;
    case "all":
      return sql`(
        SELECT COUNT(DISTINCT ${groupMember.groupId})
        FROM ${groupMember}
        WHERE ${groupMember.memberId} = ${clubMember.id}
          AND ${groupMember.groupId} IN (${idsList})
          AND ${groupMember.endDate} IS NULL
      ) = ${groups.ids.length}`;
  }
}

// ─── Membership status (computed per row for output) ─────────────────────────
function resolveMembershipStatus(
  cancelledAt: Date | null,
  effectiveDate: string | null,
  today: string,
): MemberStatus {
  if (!cancelledAt) return "active";
  if (!effectiveDate || effectiveDate >= today) return "cancelled_but_active";
  return "cancelled";
}

// ─── Input schema ────────────────────────────────────────────────────────────
const input = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Broad search across many fields — ilike `%search%`.
  search: z.string().optional(),

  // Shortcut filters. Each is independent and AND's with the others + the
  // generic `filters` array.
  statuses: z.array(z.enum(STATUSES)).optional(),
  groups: z
    .object({
      mode: z.enum(["any", "all", "none"]),
      ids: z.array(databaseIdSchema).min(1),
    })
    .optional(),
  memberIds: z.array(databaseIdSchema).optional(),

  // Generic filter array. `filterMode` controls AND-vs-OR between *these*
  // clauses; the result still ANDs against the shortcuts above and `search`.
  filterMode: z.enum(["and", "or"]).default("and"),
  filters: z.array(filterClauseSchema).optional(),

  sort: z
    .object({
      field: z.enum(SORT_FIELDS as [SortField, ...SortField[]]).default("createdAt"),
      direction: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});

export const queryMembers = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ members: ["view"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const { page, limit } = input;
    const today = ymdInBerlin(new Date());

    const rawSearch = input.search?.trim();
    const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

    // ─── Build WHERE ────────────────────────────────────────────────────────
    const statuses = input.statuses ? [...new Set(input.statuses)] : [];
    const statusFilter =
      statuses.length === 0 || statuses.length === STATUSES.length
        ? undefined
        : or(...statuses.map((s) => statusPredicate(s, today)));

    const searchFilter = search
      ? or(
          ilike(clubMember.firstName, `%${search}%`),
          ilike(clubMember.lastName, `%${search}%`),
          ilike(sql`CAST(${clubMember.birthdate} AS TEXT)`, `%${search}%`),
          ilike(clubMember.email, `%${search}%`),
          ilike(clubMember.phone, `%${search}%`),
          ilike(clubMember.street, `%${search}%`),
          ilike(clubMember.city, `%${search}%`),
          ilike(clubMember.state, `%${search}%`),
          ilike(clubMember.postalCode, `%${search}%`),
          ilike(clubMember.country, `%${search}%`),
          ilike(clubMember.notes, `%${search}%`),
          ilike(clubMember.guardianName, `%${search}%`),
          ilike(clubMember.guardianEmail, `%${search}%`),
          ilike(clubMember.guardianPhone, `%${search}%`),
          ilike(sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`, `%${search}%`),
          ilike(contract.initialPeriod, `%${search}%`),
          ilike(contract.cancellationReason, `%${search}%`),
          ilike(sql`CAST(${contract.startDate} AS TEXT)`, `%${search}%`),
          ilike(sql`CAST(${contract.cancellationEffectiveDate} AS TEXT)`, `%${search}%`),
          ilike(sql`CAST(${contract.cancelledAt} AS TEXT)`, `%${search}%`),
        )
      : undefined;

    const filterClauses = (input.filters ?? []).map(buildFilterClause);
    const combinedFilterClause =
      filterClauses.length === 0
        ? undefined
        : input.filterMode === "or"
          ? or(...filterClauses)
          : and(...filterClauses);

    const whereExpr = and(
      eq(clubMember.organizationId, context.organizationId),
      input.memberIds?.length ? inArray(clubMember.id, input.memberIds) : undefined,
      searchFilter,
      input.groups ? groupFilterExpr(input.groups) : undefined,
      statusFilter,
      combinedFilterClause,
    );

    // ─── Sort ───────────────────────────────────────────────────────────────
    const sortField: SortField = input.sort?.field ?? "createdAt";
    const sortDirection = input.sort?.direction ?? "desc";
    const sortExpr = SORT_EXPRS[sortField];
    const orderBy = sortDirection === "asc" ? sql`${sortExpr} ASC` : sql`${sortExpr} DESC`;

    // ─── Fetch ──────────────────────────────────────────────────────────────
    const [rows, totalRow] = await Promise.all([
      db
        .select({ member: clubMember, contract })
        .from(clubMember)
        .innerJoin(contract, eq(contract.memberId, clubMember.id))
        .where(whereExpr)
        .orderBy(orderBy)
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
    const groupsByMember = await loadGroupMembershipsByMember(rows.map((r) => r.member.id));

    const totalPages = Math.ceil(totalCount / limit);
    context.log?.set({
      data: {
        query: {
          resultCount: rows.length,
          totalCount,
          filterCount: input.filters?.length ?? 0,
        },
      },
    });

    return {
      data: rows.map(({ member, contract: contractRow }) => ({
        ...member,
        membershipStatus: resolveMembershipStatus(
          contractRow.cancelledAt,
          contractRow.cancellationEffectiveDate,
          today,
        ),
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
  .route({ method: "POST", path: "/members/query" });

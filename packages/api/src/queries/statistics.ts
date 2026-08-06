/**
 * Set-based aggregates for the statistics engine.
 *
 * Everything here returns **integer cents** and **plain counts** — no float
 * euros, no presentation formatting. The timeline's six functions each issue a
 * single `GROUP BY date_trunc('month', …)` query, so the whole timeline is six
 * round-trips regardless of how many months are requested (wt ran one overview
 * — ~7 queries — per month, up to 120 months).
 *
 * Month keys are `YYYY-MM`; date bounds are `YYYY-MM-DD` strings compared
 * directly against `date` columns. Ranges are half-open: `>= startDate` and
 * `< endExclusiveDate`.
 */

import {
  and,
  type AnyColumn,
  db,
  eq,
  gte,
  isNull,
  lt,
  or,
  type SQL,
  sql,
} from "@matdesk/db";
import {
  clubMember,
  contract,
  group,
  groupMember,
  invoice,
  invoiceLine,
} from "@matdesk/db/schema";

/** `to_char(date_trunc('month', col), 'YYYY-MM')` as a typed month-key column. */
function monthKeyCol(col: AnyColumn) {
  return sql<string>`to_char(date_trunc('month', ${col}), 'YYYY-MM')`;
}

// ─── Timeline: per-month flows ───────────────────────────────────────────────

/** Contracts whose `startDate` falls in each month → new enrollments. */
export async function loadEnrollmentsByMonth(
  organizationId: string,
  startDate: string,
  endExclusiveDate: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      month: monthKeyCol(contract.startDate),
      count: sql<number>`COUNT(*)::int`,
    })
    .from(contract)
    .where(
      and(
        eq(contract.organizationId, organizationId),
        gte(contract.startDate, startDate),
        lt(contract.startDate, endExclusiveDate),
      ),
    )
    .groupBy(sql`date_trunc('month', ${contract.startDate})`);

  return new Map(rows.map((r) => [r.month, r.count]));
}

/** Contracts whose `cancellationEffectiveDate` falls in each month → churn. */
export async function loadCancellationsByMonth(
  organizationId: string,
  startDate: string,
  endExclusiveDate: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      month: monthKeyCol(contract.cancellationEffectiveDate),
      count: sql<number>`COUNT(*)::int`,
    })
    .from(contract)
    .where(
      and(
        eq(contract.organizationId, organizationId),
        gte(contract.cancellationEffectiveDate, startDate),
        lt(contract.cancellationEffectiveDate, endExclusiveDate),
      ),
    )
    .groupBy(sql`date_trunc('month', ${contract.cancellationEffectiveDate})`);

  return new Map(rows.map((r) => [r.month, r.count]));
}

/**
 * Count contracts active immediately before `asOfDate` (the timeline baseline):
 * started before it and not yet ended as of it. Equivalent to "active at the
 * end of the previous month" when `asOfDate` is a month start.
 */
export async function countActiveContractsBefore(
  organizationId: string,
  asOfDate: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(contract)
    .where(
      and(
        eq(contract.organizationId, organizationId),
        lt(contract.startDate, asOfDate),
        or(
          isNull(contract.cancellationEffectiveDate),
          gte(contract.cancellationEffectiveDate, asOfDate),
        ),
      ),
    );
  return row?.count ?? 0;
}

export type RevenueByType = {
  membershipCents: number;
  joiningFeeCents: number;
  yearlyFeeCents: number;
};

/**
 * Finalized invoice-line revenue per month, split by fee type and bucketed on
 * the invoice's `billingPeriodStart`. `membership` folds in `arrears` (late
 * membership catch-up) since both are recurring-membership revenue.
 */
export async function loadRevenueByTypeByMonth(
  organizationId: string,
  startDate: string,
  endExclusiveDate: string,
): Promise<Map<string, RevenueByType>> {
  const rows = await db
    .select({
      month: monthKeyCol(invoice.billingPeriodStart),
      membershipCents: sql<number>`COALESCE(SUM(${invoiceLine.totalAmountCents}) FILTER (WHERE ${invoiceLine.type} IN ('membership_fee', 'arrears')), 0)::int`,
      joiningFeeCents: sql<number>`COALESCE(SUM(${invoiceLine.totalAmountCents}) FILTER (WHERE ${invoiceLine.type} = 'joining_fee'), 0)::int`,
      yearlyFeeCents: sql<number>`COALESCE(SUM(${invoiceLine.totalAmountCents}) FILTER (WHERE ${invoiceLine.type} = 'yearly_fee'), 0)::int`,
    })
    .from(invoiceLine)
    .innerJoin(invoice, eq(invoice.id, invoiceLine.invoiceId))
    .where(
      and(
        eq(invoiceLine.organizationId, organizationId),
        eq(invoice.status, "finalized"),
        gte(invoice.billingPeriodStart, startDate),
        lt(invoice.billingPeriodStart, endExclusiveDate),
      ),
    )
    .groupBy(sql`date_trunc('month', ${invoice.billingPeriodStart})`);

  return new Map(
    rows.map((r) => [
      r.month,
      {
        membershipCents: r.membershipCents,
        joiningFeeCents: r.joiningFeeCents,
        yearlyFeeCents: r.yearlyFeeCents,
      },
    ]),
  );
}

export type BilledSubmitted = {
  billedCents: number;
  submittedCents: number;
};

/**
 * Per month: total **billed** (finalized invoice totals) and **submitted**
 * (the subset whose invoice sits in a *downloaded* SEPA batch — i.e. actually
 * sent to the bank for collection). `billed - submitted` is the period's
 * outstanding flow.
 */
export async function loadBilledSubmittedByMonth(
  organizationId: string,
  startDate: string,
  endExclusiveDate: string,
): Promise<Map<string, BilledSubmitted>> {
  const rows = await db
    .select({
      month: monthKeyCol(invoice.billingPeriodStart),
      billedCents: sql<number>`COALESCE(SUM(${invoice.totalCents}), 0)::int`,
      submittedCents: sql<number>`COALESCE(SUM(${invoice.totalCents}) FILTER (WHERE EXISTS (
        SELECT 1 FROM sepa_batch_item sbi
        JOIN sepa_batch sb ON sb.id = sbi.sepa_batch_id
        WHERE sbi.invoice_id = "invoice"."id"
          AND sbi.status = 'included'
          AND sb.status = 'downloaded'
      )), 0)::int`,
    })
    .from(invoice)
    .where(
      and(
        eq(invoice.organizationId, organizationId),
        eq(invoice.status, "finalized"),
        gte(invoice.billingPeriodStart, startDate),
        lt(invoice.billingPeriodStart, endExclusiveDate),
      ),
    )
    .groupBy(sql`date_trunc('month', ${invoice.billingPeriodStart})`);

  return new Map(
    rows.map((r) => [
      r.month,
      { billedCents: r.billedCents, submittedCents: r.submittedCents },
    ]),
  );
}

export type GroupRevenue = {
  groupId: string;
  name: string;
  color: string;
  totalCents: number;
};

/** Finalized membership revenue per month, per group. */
export async function loadRevenueByGroupByMonth(
  organizationId: string,
  startDate: string,
  endExclusiveDate: string,
): Promise<Map<string, GroupRevenue[]>> {
  const rows = await db
    .select({
      month: monthKeyCol(invoice.billingPeriodStart),
      groupId: group.id,
      name: group.name,
      color: group.color,
      totalCents: sql<number>`COALESCE(SUM(${invoiceLine.totalAmountCents}) FILTER (WHERE ${invoiceLine.type} = 'membership_fee'), 0)::int`,
    })
    .from(invoiceLine)
    .innerJoin(invoice, eq(invoice.id, invoiceLine.invoiceId))
    .innerJoin(group, eq(group.id, invoiceLine.groupId))
    .where(
      and(
        eq(invoiceLine.organizationId, organizationId),
        eq(invoice.status, "finalized"),
        gte(invoice.billingPeriodStart, startDate),
        lt(invoice.billingPeriodStart, endExclusiveDate),
      ),
    )
    .groupBy(
      sql`date_trunc('month', ${invoice.billingPeriodStart})`,
      group.id,
      group.name,
      group.color,
    );

  const byMonth = new Map<string, GroupRevenue[]>();
  for (const r of rows) {
    const list = byMonth.get(r.month) ?? [];
    list.push({
      groupId: r.groupId,
      name: r.name,
      color: r.color,
      totalCents: r.totalCents,
    });
    byMonth.set(r.month, list);
  }
  return byMonth;
}

// ─── Snapshot: current stocks ────────────────────────────────────────────────

/** Contracts active on `asOf` (started on/before it, not yet ended after it). */
export async function countActiveContractsAsOf(
  organizationId: string,
  asOf: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(contract)
    .where(
      and(
        eq(contract.organizationId, organizationId),
        sql`${contract.startDate} <= ${asOf}`,
        or(
          isNull(contract.cancellationEffectiveDate),
          sql`${contract.cancellationEffectiveDate} > ${asOf}`,
        ),
      ),
    );
  return row?.count ?? 0;
}

export type GroupMixEntry = {
  groupId: string;
  name: string;
  color: string;
  count: number;
};

/** Current member count per group (active spells only). Includes empty groups. */
export async function loadActiveGroupMix(
  organizationId: string,
): Promise<GroupMixEntry[]> {
  const rows = await db
    .select({
      groupId: group.id,
      name: group.name,
      color: group.color,
      count: sql<number>`COUNT(${groupMember.id})::int`,
    })
    .from(group)
    .leftJoin(
      groupMember,
      and(eq(groupMember.groupId, group.id), isNull(groupMember.endDate)),
    )
    .where(eq(group.organizationId, organizationId))
    .groupBy(group.id, group.name, group.color);

  return rows;
}

/** Sum of membership prices across all currently-active group memberships.
 *  The recurring membership value at the current cadence (not normalized to a
 *  monthly figure — billing cadence varies by contract). */
export async function sumActiveMembershipValueCents(
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${groupMember.membershipPriceCents}), 0)::int`,
    })
    .from(groupMember)
    .innerJoin(group, eq(group.id, groupMember.groupId))
    .where(
      and(eq(group.organizationId, organizationId), isNull(groupMember.endDate)),
    );
  return row?.total ?? 0;
}

/** Finalized invoices not yet submitted for collection (no included line in a
 *  downloaded batch). The real "outstanding" the wt code hardcoded to 0. */
export async function sumOutstandingCents(
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${invoice.totalCents}), 0)::int`,
    })
    .from(invoice)
    .where(
      and(
        eq(invoice.organizationId, organizationId),
        eq(invoice.status, "finalized"),
        sql`NOT EXISTS (
          SELECT 1 FROM sepa_batch_item sbi
          JOIN sepa_batch sb ON sb.id = sbi.sepa_batch_id
          WHERE sbi.invoice_id = "invoice"."id"
            AND sbi.status = 'included'
            AND sb.status = 'downloaded'
        )`,
      ),
    );
  return row?.total ?? 0;
}

/** Draft invoices not yet finalized — the upcoming billing pipeline. */
export async function sumDraftCents(organizationId: string): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${invoice.totalCents}), 0)::int`,
    })
    .from(invoice)
    .where(
      and(
        eq(invoice.organizationId, organizationId),
        eq(invoice.status, "draft"),
      ),
    );
  return row?.total ?? 0;
}

// ─── Member map ──────────────────────────────────────────────────────────────

export type MemberMapRow = {
  memberId: string;
  firstName: string;
  lastName: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  groupId: string | null;
};

export type MemberMapFilter = {
  includeActive: boolean;
  includeCancelledButActive: boolean;
  includeCancelled: boolean;
  /** Berlin "today" (YYYY-MM-DD) — the cutoff for cancelled-but-still-active. */
  today: string;
};

/** Build the OR of requested membership states. Empty array ⇒ caller short-circuits. */
function memberMapStatusConditions(filter: MemberMapFilter): SQL[] {
  const conditions: SQL[] = [];
  if (filter.includeActive) {
    conditions.push(sql`${contract.cancelledAt} IS NULL`);
  }
  if (filter.includeCancelledButActive) {
    conditions.push(
      sql`${contract.cancelledAt} IS NOT NULL AND (${contract.cancellationEffectiveDate} IS NULL OR ${contract.cancellationEffectiveDate} >= ${filter.today})`,
    );
  }
  if (filter.includeCancelled) {
    conditions.push(
      sql`${contract.cancelledAt} IS NOT NULL AND ${contract.cancellationEffectiveDate} < ${filter.today}`,
    );
  }
  return conditions;
}

/**
 * Members with a usable address, joined to their contract for status filtering
 * and to their *currently-active* group memberships (one row per group; the
 * caller folds rows per member). Returns `[]` if no membership states are
 * selected.
 */
export async function loadMemberMapRows(
  organizationId: string,
  filter: MemberMapFilter,
): Promise<MemberMapRow[]> {
  const statusConditions = memberMapStatusConditions(filter);
  if (statusConditions.length === 0) return [];

  return db
    .select({
      memberId: clubMember.id,
      firstName: clubMember.firstName,
      lastName: clubMember.lastName,
      city: clubMember.city,
      postalCode: clubMember.postalCode,
      latitude: clubMember.latitude,
      longitude: clubMember.longitude,
      groupId: groupMember.groupId,
    })
    .from(clubMember)
    .innerJoin(contract, eq(contract.memberId, clubMember.id))
    .leftJoin(
      groupMember,
      and(eq(groupMember.memberId, clubMember.id), isNull(groupMember.endDate)),
    )
    .where(
      and(
        eq(clubMember.organizationId, organizationId),
        sql`${clubMember.city} <> ''`,
        sql`${clubMember.postalCode} <> ''`,
        or(...statusConditions),
      ),
    );
}

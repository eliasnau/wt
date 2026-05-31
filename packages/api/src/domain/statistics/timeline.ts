/**
 * Pure assembly of the timeline from per-month aggregates.
 *
 * The SQL layer hands us sparse per-month numbers (a month with no activity is
 * simply absent). This function:
 *   1. walks the contiguous month series in order,
 *   2. carries a running active-member balance (`baseline + enrollments − churn`),
 *   3. buckets months into month/quarter/year periods,
 *   4. sums the flow metrics and reports each period's *end-of-period* active count,
 *   5. produces range-wide totals.
 *
 * All money is integer cents; summation stays in integers. No DB, no clock —
 * unit-tested in isolation.
 */

import { bucketFor, type GroupBy } from "./periods";

export type GroupRevenue = {
  groupId: string;
  name: string;
  color: string;
  totalCents: number;
};

/** Raw per-month metrics from the query layer (all default to 0/[]). */
export type MonthlyMetrics = {
  newEnrollments: number;
  cancellations: number;
  membershipCents: number;
  joiningFeeCents: number;
  yearlyFeeCents: number;
  billedCents: number;
  submittedCents: number;
  revenueByGroup: GroupRevenue[];
};

export type PeriodRevenue = {
  membershipCents: number;
  joiningFeeCents: number;
  yearlyFeeCents: number;
  feesCents: number;
  billedCents: number;
  submittedCents: number;
  outstandingCents: number;
  byGroup: GroupRevenue[];
};

export type TimelinePeriod = {
  key: string;
  label: string;
  startMonth: string;
  endMonth: string;
  activeMembersEnd: number;
  newEnrollments: number;
  cancellations: number;
  netChange: number;
  revenue: PeriodRevenue;
};

export type TimelineTotals = {
  activeMembersStart: number;
  activeMembersEnd: number;
  newEnrollments: number;
  cancellations: number;
  netChange: number;
  revenue: Omit<PeriodRevenue, "byGroup">;
};

const ZERO: MonthlyMetrics = {
  newEnrollments: 0,
  cancellations: 0,
  membershipCents: 0,
  joiningFeeCents: 0,
  yearlyFeeCents: 0,
  billedCents: 0,
  submittedCents: 0,
  revenueByGroup: [],
};

type MutablePeriod = Omit<TimelinePeriod, "revenue"> & {
  revenue: Omit<PeriodRevenue, "byGroup">;
  byGroup: Map<string, GroupRevenue>;
};

function mergeGroup(into: Map<string, GroupRevenue>, entry: GroupRevenue) {
  const existing = into.get(entry.groupId);
  if (existing) {
    existing.totalCents += entry.totalCents;
  } else {
    into.set(entry.groupId, { ...entry });
  }
}

export function assembleTimeline(params: {
  months: string[];
  baselineActive: number;
  monthly: Record<string, MonthlyMetrics>;
  groupBy: GroupBy;
}): { periods: TimelinePeriod[]; totals: TimelineTotals } {
  const { months, baselineActive, monthly, groupBy } = params;

  const order: string[] = [];
  const periods = new Map<string, MutablePeriod>();

  let running = baselineActive;
  const totals: TimelineTotals = {
    activeMembersStart: baselineActive,
    activeMembersEnd: baselineActive,
    newEnrollments: 0,
    cancellations: 0,
    netChange: 0,
    revenue: {
      membershipCents: 0,
      joiningFeeCents: 0,
      yearlyFeeCents: 0,
      feesCents: 0,
      billedCents: 0,
      submittedCents: 0,
      outstandingCents: 0,
    },
  };

  for (const month of months) {
    const m = monthly[month] ?? ZERO;
    running += m.newEnrollments - m.cancellations;

    const { key, label } = bucketFor(month, groupBy);
    let period = periods.get(key);
    if (!period) {
      period = {
        key,
        label,
        startMonth: month,
        endMonth: month,
        activeMembersEnd: running,
        newEnrollments: 0,
        cancellations: 0,
        netChange: 0,
        revenue: {
          membershipCents: 0,
          joiningFeeCents: 0,
          yearlyFeeCents: 0,
          feesCents: 0,
          billedCents: 0,
          submittedCents: 0,
          outstandingCents: 0,
        },
        byGroup: new Map(),
      };
      periods.set(key, period);
      order.push(key);
    }

    period.endMonth = month;
    period.activeMembersEnd = running; // last month in the bucket wins
    period.newEnrollments += m.newEnrollments;
    period.cancellations += m.cancellations;
    period.netChange += m.newEnrollments - m.cancellations;
    period.revenue.membershipCents += m.membershipCents;
    period.revenue.joiningFeeCents += m.joiningFeeCents;
    period.revenue.yearlyFeeCents += m.yearlyFeeCents;
    period.revenue.billedCents += m.billedCents;
    period.revenue.submittedCents += m.submittedCents;
    for (const g of m.revenueByGroup) mergeGroup(period.byGroup, g);

    totals.newEnrollments += m.newEnrollments;
    totals.cancellations += m.cancellations;
    totals.revenue.membershipCents += m.membershipCents;
    totals.revenue.joiningFeeCents += m.joiningFeeCents;
    totals.revenue.yearlyFeeCents += m.yearlyFeeCents;
    totals.revenue.billedCents += m.billedCents;
    totals.revenue.submittedCents += m.submittedCents;
  }

  totals.activeMembersEnd = running;
  totals.netChange = totals.newEnrollments - totals.cancellations;
  totals.revenue.feesCents =
    totals.revenue.joiningFeeCents + totals.revenue.yearlyFeeCents;
  totals.revenue.outstandingCents =
    totals.revenue.billedCents - totals.revenue.submittedCents;

  const finalizedPeriods: TimelinePeriod[] = order.map((key) => {
    const p = periods.get(key) as MutablePeriod;
    return {
      key: p.key,
      label: p.label,
      startMonth: p.startMonth,
      endMonth: p.endMonth,
      activeMembersEnd: p.activeMembersEnd,
      newEnrollments: p.newEnrollments,
      cancellations: p.cancellations,
      netChange: p.netChange,
      revenue: {
        membershipCents: p.revenue.membershipCents,
        joiningFeeCents: p.revenue.joiningFeeCents,
        yearlyFeeCents: p.revenue.yearlyFeeCents,
        feesCents: p.revenue.joiningFeeCents + p.revenue.yearlyFeeCents,
        billedCents: p.revenue.billedCents,
        submittedCents: p.revenue.submittedCents,
        outstandingCents: p.revenue.billedCents - p.revenue.submittedCents,
        byGroup: Array.from(p.byGroup.values()).sort(
          (a, b) => b.totalCents - a.totalCents,
        ),
      },
    };
  });

  return { periods: finalizedPeriods, totals };
}

import { describe, expect, it } from "vitest";

import { assembleTimeline, type MonthlyMetrics } from "./timeline";

function metrics(partial: Partial<MonthlyMetrics>): MonthlyMetrics {
  return {
    newEnrollments: 0,
    cancellations: 0,
    membershipCents: 0,
    joiningFeeCents: 0,
    yearlyFeeCents: 0,
    billedCents: 0,
    submittedCents: 0,
    revenueByGroup: [],
    ...partial,
  };
}

describe("assembleTimeline", () => {
  it("carries a running active balance from the baseline across months", () => {
    const { periods, totals } = assembleTimeline({
      months: ["2026-01", "2026-02", "2026-03"],
      baselineActive: 100,
      groupBy: "month",
      monthly: {
        "2026-01": metrics({ newEnrollments: 10, cancellations: 2 }),
        "2026-02": metrics({ newEnrollments: 5, cancellations: 8 }),
        // 2026-03 absent → zeros
      },
    });

    expect(periods.map((p) => p.activeMembersEnd)).toEqual([108, 105, 105]);
    expect(periods.map((p) => p.netChange)).toEqual([8, -3, 0]);
    expect(totals.activeMembersStart).toBe(100);
    expect(totals.activeMembersEnd).toBe(105);
    expect(totals.newEnrollments).toBe(15);
    expect(totals.cancellations).toBe(10);
    expect(totals.netChange).toBe(5);
  });

  it("buckets months into quarters, taking end-of-quarter active and summing flows", () => {
    const { periods } = assembleTimeline({
      months: ["2026-01", "2026-02", "2026-03", "2026-04"],
      baselineActive: 0,
      groupBy: "quarter",
      monthly: {
        "2026-01": metrics({ newEnrollments: 3, billedCents: 1000 }),
        "2026-02": metrics({ newEnrollments: 4, billedCents: 2000 }),
        "2026-03": metrics({ newEnrollments: 1, billedCents: 500 }),
        "2026-04": metrics({ newEnrollments: 2, billedCents: 700 }),
      },
    });

    expect(periods).toHaveLength(2);
    const [q1, q2] = periods;
    expect(q1?.key).toBe("2026-Q1");
    expect(q1?.startMonth).toBe("2026-01");
    expect(q1?.endMonth).toBe("2026-03");
    expect(q1?.newEnrollments).toBe(8);
    expect(q1?.activeMembersEnd).toBe(8); // 3+4+1 running, no churn
    expect(q1?.revenue.billedCents).toBe(3500);
    expect(q2?.key).toBe("2026-Q2");
    expect(q2?.activeMembersEnd).toBe(10);
    expect(q2?.revenue.billedCents).toBe(700);
  });

  it("derives fees and outstanding, and stays in integer cents", () => {
    const { periods, totals } = assembleTimeline({
      months: ["2026-01"],
      baselineActive: 0,
      groupBy: "month",
      monthly: {
        "2026-01": metrics({
          joiningFeeCents: 1500,
          yearlyFeeCents: 12000,
          billedCents: 50000,
          submittedCents: 30000,
        }),
      },
    });

    const rev = periods[0]?.revenue;
    expect(rev?.feesCents).toBe(13500);
    expect(rev?.outstandingCents).toBe(20000);
    expect(totals.revenue.feesCents).toBe(13500);
    expect(totals.revenue.outstandingCents).toBe(20000);
  });

  it("merges revenue-by-group across months in a bucket and sorts descending", () => {
    const { periods } = assembleTimeline({
      months: ["2026-01", "2026-02"],
      baselineActive: 0,
      groupBy: "quarter",
      monthly: {
        "2026-01": metrics({
          revenueByGroup: [
            { groupId: "a", name: "A", color: "#a", totalCents: 100 },
            { groupId: "b", name: "B", color: "#b", totalCents: 900 },
          ],
        }),
        "2026-02": metrics({
          revenueByGroup: [
            { groupId: "a", name: "A", color: "#a", totalCents: 400 },
          ],
        }),
      },
    });

    expect(periods[0]?.revenue.byGroup).toEqual([
      { groupId: "b", name: "B", color: "#b", totalCents: 900 },
      { groupId: "a", name: "A", color: "#a", totalCents: 500 },
    ]);
  });

  it("handles an empty range", () => {
    const { periods, totals } = assembleTimeline({
      months: [],
      baselineActive: 42,
      groupBy: "month",
      monthly: {},
    });
    expect(periods).toEqual([]);
    expect(totals.activeMembersStart).toBe(42);
    expect(totals.activeMembersEnd).toBe(42);
  });
});

import { ymdInBerlin } from "../../domain/members/cancellation";
import { resolveMonthRange } from "../../domain/statistics/periods";
import {
  assembleTimeline,
  type MonthlyMetrics,
} from "../../domain/statistics/timeline";
import { statisticsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import {
  countActiveContractsBefore,
  loadBilledSubmittedByMonth,
  loadCancellationsByMonth,
  loadEnrollmentsByMonth,
  loadRevenueByGroupByMonth,
  loadRevenueByTypeByMonth,
} from "../../queries/statistics";
import { timelineInput } from "./schemas";

const DEFAULT_MONTHS = 12;
const MAX_MONTHS = 120;

export const getTimeline = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ statistics: ["view"], financeStatistics: ["view"] }))
  .input(timelineInput)
  .handler(async ({ input, context }) => {
    const currentMonth = ymdInBerlin(new Date()).slice(0, 7);
    const resolved = resolveMonthRange(
      { startMonth: input.startMonth, endMonth: input.endMonth },
      { currentMonth, defaultMonths: DEFAULT_MONTHS, maxMonths: MAX_MONTHS },
    );
    if (!resolved.ok) {
      const internal = {
        startMonth: input.startMonth,
        endMonth: input.endMonth,
        currentMonth,
      };
      throw resolved.violation === "RANGE_TOO_LARGE"
        ? statisticsErrors.RANGE_TOO_LARGE({ internal })
        : statisticsErrors.INVALID_RANGE({ internal });
    }

    const { months, startDate, endExclusiveDate, startMonth, endMonth } =
      resolved.range;
    const organizationId = context.organizationId;

    // Six set-based queries cover the entire range — no per-month fan-out.
    const [enrollments, cancellations, baselineActive, byType, billed, byGroup] =
      await Promise.all([
        loadEnrollmentsByMonth(organizationId, startDate, endExclusiveDate),
        loadCancellationsByMonth(organizationId, startDate, endExclusiveDate),
        countActiveContractsBefore(organizationId, startDate),
        loadRevenueByTypeByMonth(organizationId, startDate, endExclusiveDate),
        loadBilledSubmittedByMonth(organizationId, startDate, endExclusiveDate),
        loadRevenueByGroupByMonth(organizationId, startDate, endExclusiveDate),
      ]);

    const monthly: Record<string, MonthlyMetrics> = {};
    for (const month of months) {
      const type = byType.get(month);
      const bill = billed.get(month);
      monthly[month] = {
        newEnrollments: enrollments.get(month) ?? 0,
        cancellations: cancellations.get(month) ?? 0,
        membershipCents: type?.membershipCents ?? 0,
        joiningFeeCents: type?.joiningFeeCents ?? 0,
        yearlyFeeCents: type?.yearlyFeeCents ?? 0,
        billedCents: bill?.billedCents ?? 0,
        submittedCents: bill?.submittedCents ?? 0,
        revenueByGroup: byGroup.get(month) ?? [],
      };
    }

    const { periods, totals } = assembleTimeline({
      months,
      baselineActive,
      monthly,
      groupBy: input.groupBy,
    });

    context.log?.set({
      data: {
        statistics: {
          startMonth,
          endMonth,
          groupBy: input.groupBy,
          periodCount: periods.length,
        },
      },
    });

    return {
      range: {
        startMonth,
        endMonth,
        startDate,
        endExclusive: endExclusiveDate,
        groupBy: input.groupBy,
      },
      periods,
      totals,
    };
  })
  .route({ method: "GET", path: "/statistics/timeline" });

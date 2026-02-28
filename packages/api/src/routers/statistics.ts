import { ORPCError } from "@orpc/server";
import { and, count, db, eq, sql } from "@repo/db";
import { contract, group, groupMember, payment } from "@repo/db/schema";
import { after } from "next/server";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { logger } from "../lib/logger";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const maxTimelineMonths = 120;
const defaultTimelineMonths = 12;

const monthSchema = z.object({
	month: z.string().regex(monthRegex, "Month must be YYYY-MM").optional(),
});

const timelineSchema = z.object({
	startMonth: z
		.string()
		.regex(monthRegex, "Start month must be YYYY-MM")
		.optional(),
	endMonth: z
		.string()
		.regex(monthRegex, "End month must be YYYY-MM")
		.optional(),
	groupBy: z.enum(["month", "quarter", "year"]).default("month"),
});

type TimelineGroupBy = z.infer<typeof timelineSchema>["groupBy"];

type MonthlyOverviewData = {
	month: string;
	range: {
		start: string;
		endExclusive: string;
	};
	kpis: {
		activeMembers: number;
		newEnrollments: number;
		revenueCollected: string;
	};
	membership: {
		newMembers: number;
		cancellations: number;
		groupMix: Array<{
			groupId: string;
			name: string;
			color: string | null;
			count: number;
		}>;
	};
	revenue: {
		membershipTotal: string;
		feesTotal: string;
		joiningFeeTotal: string;
		yearlyFeeTotal: string;
		outstanding: string;
		byGroup: Array<{
			groupId: string;
			name: string;
			color: string | null;
			total: string;
		}>;
	};
};

function formatDateUTC(date: Date) {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function formatMonthUTC(date: Date) {
	return formatDateUTC(date).slice(0, 7);
}

function parseMonthInput(monthInput: string) {
	const [year, month] = monthInput.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, 1));
}

function addUTCMonths(date: Date, months: number) {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
	);
}

function getCurrentMonthUTC() {
	const now = new Date();
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function getMonthRangeFromDate(monthDate: Date) {
	const nextMonth = addUTCMonths(monthDate, 1);
	const startDate = formatDateUTC(monthDate);
	const nextMonthStartDate = formatDateUTC(nextMonth);

	return {
		monthDate,
		startDate,
		nextMonthStartDate,
		month: formatMonthUTC(monthDate),
	};
}

function getMonthRange(monthInput?: string) {
	const currentMonth = getCurrentMonthUTC();
	const targetMonth = monthInput ? parseMonthInput(monthInput) : currentMonth;

	if (targetMonth > currentMonth) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Month cannot be in the future",
		});
	}

	return getMonthRangeFromDate(targetMonth);
}

function getTimelineRange(input: z.infer<typeof timelineSchema>) {
	const currentMonth = getCurrentMonthUTC();
	const endMonthDate = input.endMonth
		? parseMonthInput(input.endMonth)
		: currentMonth;

	if (endMonthDate > currentMonth) {
		throw new ORPCError("BAD_REQUEST", {
			message: "End month cannot be in the future",
		});
	}

	const startMonthDate = input.startMonth
		? parseMonthInput(input.startMonth)
		: addUTCMonths(endMonthDate, -(defaultTimelineMonths - 1));

	if (startMonthDate > endMonthDate) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Start month cannot be after end month",
		});
	}

	const months: Date[] = [];
	for (
		let cursor = startMonthDate;
		cursor <= endMonthDate;
		cursor = addUTCMonths(cursor, 1)
	) {
		months.push(cursor);
	}

	if (months.length > maxTimelineMonths) {
		throw new ORPCError("BAD_REQUEST", {
			message: `Timeline range cannot exceed ${maxTimelineMonths} months`,
		});
	}

	const endExclusiveDate = addUTCMonths(endMonthDate, 1);
	return {
		startDate: formatDateUTC(startMonthDate),
		endExclusiveDate: formatDateUTC(endExclusiveDate),
		startMonth: formatMonthUTC(startMonthDate),
		endMonth: formatMonthUTC(endMonthDate),
		months,
	};
}

function toNumber(value: string | number | null | undefined) {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : 0;
	}

	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	return 0;
}

function getBucketIdentity(monthDate: Date, groupBy: TimelineGroupBy) {
	const year = monthDate.getUTCFullYear();
	const month = monthDate.getUTCMonth();

	if (groupBy === "year") {
		return {
			key: String(year),
			label: String(year),
		};
	}

	if (groupBy === "quarter") {
		const quarter = Math.floor(month / 3) + 1;
		return {
			key: `${year}-Q${quarter}`,
			label: `Q${quarter} ${year}`,
		};
	}

	return {
		key: formatMonthUTC(monthDate),
		label: formatMonthUTC(monthDate),
	};
}

function getActiveOrganizationId(
	activeOrganizationId: string | null | undefined,
) {
	if (!activeOrganizationId) {
		throw new ORPCError("FORBIDDEN", {
			message: "No active organization selected",
		});
	}

	return activeOrganizationId;
}

async function loadMonthlyOverviewData(params: {
	organizationId: string;
	monthDate: Date;
}) {
	const { organizationId, monthDate } = params;
	const { startDate, nextMonthStartDate, month } =
		getMonthRangeFromDate(monthDate);

	const [{ count: activeMembers = 0 } = { count: 0 }] = await db
		.select({ count: count() })
		.from(contract)
		.where(
			and(
				eq(contract.organizationId, organizationId),
				sql`${contract.startDate} < ${nextMonthStartDate}`,
				sql`(${contract.cancellationEffectiveDate} IS NULL OR ${contract.cancellationEffectiveDate} >= ${startDate})`,
			),
		);

	const [{ count: newEnrollments = 0 } = { count: 0 }] = await db
		.select({ count: count() })
		.from(contract)
		.where(
			and(
				eq(contract.organizationId, organizationId),
				sql`${contract.startDate} >= ${startDate}`,
				sql`${contract.startDate} < ${nextMonthStartDate}`,
			),
		);

	const [{ count: cancellations = 0 } = { count: 0 }] = await db
		.select({ count: count() })
		.from(contract)
		.where(
			and(
				eq(contract.organizationId, organizationId),
				sql`${contract.cancellationEffectiveDate} IS NOT NULL`,
				sql`${contract.cancellationEffectiveDate} >= ${startDate}`,
				sql`${contract.cancellationEffectiveDate} < ${nextMonthStartDate}`,
			),
		);

	const [paymentTotals] = await db
		.select({
			membershipTotal: sql<string>`COALESCE(SUM(${payment.membershipAmount}), 0)`,
			joiningFeeTotal: sql<string>`COALESCE(SUM(${payment.joiningFeeAmount}), 0)`,
			yearlyFeeTotal: sql<string>`COALESCE(SUM(${payment.yearlyFeeAmount}), 0)`,
			totalAmount: sql<string>`COALESCE(SUM(${payment.totalAmount}), 0)`,
		})
		.from(payment)
		.innerJoin(contract, eq(contract.id, payment.contractId))
		.where(
			and(
				eq(contract.organizationId, organizationId),
				sql`${payment.billingPeriodStart} >= ${startDate}`,
				sql`${payment.billingPeriodStart} < ${nextMonthStartDate}`,
			),
		);

	const revenueByGroup = await db
		.select({
			groupId: group.id,
			groupName: group.name,
			groupColor: group.color,
			total: sql<string>`COALESCE(SUM(${payment.membershipAmount}), 0)`,
		})
		.from(payment)
		.innerJoin(contract, eq(contract.id, payment.contractId))
		.innerJoin(groupMember, eq(groupMember.memberId, contract.memberId))
		.innerJoin(group, eq(group.id, groupMember.groupId))
		.where(
			and(
				eq(contract.organizationId, organizationId),
				sql`${payment.billingPeriodStart} >= ${startDate}`,
				sql`${payment.billingPeriodStart} < ${nextMonthStartDate}`,
				sql`${groupMember.createdAt} < ${nextMonthStartDate}`,
			),
		)
		.groupBy(group.id);

	const groupMix = await db
		.select({
			groupId: group.id,
			groupName: group.name,
			groupColor: group.color,
			memberCount: sql<number>`COUNT(${groupMember.memberId})`,
		})
		.from(group)
		.leftJoin(groupMember, eq(groupMember.groupId, group.id))
		.where(
			and(
				eq(group.organizationId, organizationId),
				sql`(${groupMember.createdAt} IS NULL OR ${groupMember.createdAt} < ${nextMonthStartDate})`,
			),
		)
		.groupBy(group.id);

	const feesTotalValue =
		toNumber(paymentTotals?.joiningFeeTotal) +
		toNumber(paymentTotals?.yearlyFeeTotal);

	return {
		month,
		range: {
			start: startDate,
			endExclusive: nextMonthStartDate,
		},
		kpis: {
			activeMembers,
			newEnrollments,
			revenueCollected: paymentTotals?.totalAmount ?? "0",
		},
		membership: {
			newMembers: newEnrollments,
			cancellations,
			groupMix: groupMix.map((item) => ({
				groupId: item.groupId,
				name: item.groupName,
				color: item.groupColor,
				count: Number(item.memberCount ?? 0),
			})),
		},
		revenue: {
			membershipTotal: paymentTotals?.membershipTotal ?? "0",
			feesTotal: feesTotalValue.toFixed(2),
			joiningFeeTotal: paymentTotals?.joiningFeeTotal ?? "0",
			yearlyFeeTotal: paymentTotals?.yearlyFeeTotal ?? "0",
			outstanding: "0",
			byGroup: revenueByGroup.map((item) => ({
				groupId: item.groupId,
				name: item.groupName,
				color: item.groupColor,
				total: item.total ?? "0",
			})),
		},
	} satisfies MonthlyOverviewData;
}

function buildTimelinePeriods(
	monthlyData: MonthlyOverviewData[],
	groupBy: TimelineGroupBy,
) {
	const buckets = new Map<
		string,
		{
			key: string;
			label: string;
			startMonth: string;
			endMonth: string;
			startDate: string;
			endExclusive: string;
			activeMembers: number;
			newEnrollments: number;
			revenueCollected: number;
			newMembers: number;
			cancellations: number;
			membershipTotal: number;
			joiningFeeTotal: number;
			yearlyFeeTotal: number;
			outstanding: number;
			groupMix: MonthlyOverviewData["membership"]["groupMix"];
			revenueByGroup: Map<
				string,
				{
					groupId: string;
					name: string;
					color: string | null;
					total: number;
				}
			>;
		}
	>();

	for (const monthData of monthlyData) {
		const monthDate = parseMonthInput(monthData.month);
		const { key, label } = getBucketIdentity(monthDate, groupBy);

		if (!buckets.has(key)) {
			buckets.set(key, {
				key,
				label,
				startMonth: monthData.month,
				endMonth: monthData.month,
				startDate: monthData.range.start,
				endExclusive: monthData.range.endExclusive,
				activeMembers: 0,
				newEnrollments: 0,
				revenueCollected: 0,
				newMembers: 0,
				cancellations: 0,
				membershipTotal: 0,
				joiningFeeTotal: 0,
				yearlyFeeTotal: 0,
				outstanding: 0,
				groupMix: [],
				revenueByGroup: new Map(),
			});
		}

		const bucket = buckets.get(key);
		if (!bucket) {
			continue;
		}
		bucket.endMonth = monthData.month;
		bucket.endExclusive = monthData.range.endExclusive;
		bucket.activeMembers = monthData.kpis.activeMembers;
		bucket.newEnrollments += monthData.kpis.newEnrollments;
		bucket.revenueCollected += toNumber(monthData.kpis.revenueCollected);
		bucket.newMembers += monthData.membership.newMembers;
		bucket.cancellations += monthData.membership.cancellations;
		bucket.membershipTotal += toNumber(monthData.revenue.membershipTotal);
		bucket.joiningFeeTotal += toNumber(monthData.revenue.joiningFeeTotal);
		bucket.yearlyFeeTotal += toNumber(monthData.revenue.yearlyFeeTotal);
		bucket.outstanding += toNumber(monthData.revenue.outstanding);
		bucket.groupMix = monthData.membership.groupMix;

		for (const byGroupItem of monthData.revenue.byGroup) {
			const existing = bucket.revenueByGroup.get(byGroupItem.groupId);
			if (existing) {
				existing.total += toNumber(byGroupItem.total);
			} else {
				bucket.revenueByGroup.set(byGroupItem.groupId, {
					groupId: byGroupItem.groupId,
					name: byGroupItem.name,
					color: byGroupItem.color,
					total: toNumber(byGroupItem.total),
				});
			}
		}
	}

	return Array.from(buckets.values()).map((bucket) => {
		const feesTotal = bucket.joiningFeeTotal + bucket.yearlyFeeTotal;
		return {
			key: bucket.key,
			label: bucket.label,
			startMonth: bucket.startMonth,
			endMonth: bucket.endMonth,
			range: {
				start: bucket.startDate,
				endExclusive: bucket.endExclusive,
			},
			kpis: {
				activeMembers: bucket.activeMembers,
				newEnrollments: bucket.newEnrollments,
				revenueCollected: bucket.revenueCollected.toFixed(2),
			},
			membership: {
				newMembers: bucket.newMembers,
				cancellations: bucket.cancellations,
				groupMix: bucket.groupMix,
			},
			revenue: {
				membershipTotal: bucket.membershipTotal.toFixed(2),
				feesTotal: feesTotal.toFixed(2),
				joiningFeeTotal: bucket.joiningFeeTotal.toFixed(2),
				yearlyFeeTotal: bucket.yearlyFeeTotal.toFixed(2),
				outstanding: bucket.outstanding.toFixed(2),
				byGroup: Array.from(bucket.revenueByGroup.values())
					.sort((a, b) => b.total - a.total)
					.map((item) => ({
						groupId: item.groupId,
						name: item.name,
						color: item.color,
						total: item.total.toFixed(2),
					})),
			},
		};
	});
}

export const statisticsRouter = {
	monthlyOverview: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(
			requirePermission({
				statistics: ["view"],
				financeStatistics: ["view"],
			}),
		)
		.input(monthSchema)
		.handler(async ({ input, context }) => {
			const organizationId = getActiveOrganizationId(
				context.session.activeOrganizationId,
			);

			const { monthDate, month } = getMonthRange(input.month);

			try {
				return await loadMonthlyOverviewData({ organizationId, monthDate });
			} catch (error) {
				after(() => {
					logger.error("Failed to get monthly statistics", {
						error,
						organizationId,
						month,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to load statistics",
				});
			}
		})
		.route({ method: "GET", path: "/statistics/monthly-overview" }),
	timeline: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(
			requirePermission({
				statistics: ["view"],
				financeStatistics: ["view"],
			}),
		)
		.input(timelineSchema)
		.handler(async ({ input, context }) => {
			const organizationId = getActiveOrganizationId(
				context.session.activeOrganizationId,
			);

			const { months, startDate, endExclusiveDate, startMonth, endMonth } =
				getTimelineRange(input);

			try {
				const monthlyData = await Promise.all(
					months.map((monthDate) =>
						loadMonthlyOverviewData({
							organizationId,
							monthDate,
						}),
					),
				);

				return {
					groupBy: input.groupBy,
					range: {
						start: startDate,
						endExclusive: endExclusiveDate,
						startMonth,
						endMonth,
					},
					periods: buildTimelinePeriods(monthlyData, input.groupBy),
				};
			} catch (error) {
				after(() => {
					logger.error("Failed to get timeline statistics", {
						error,
						organizationId,
						startMonth,
						endMonth,
						groupBy: input.groupBy,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to load timeline statistics",
				});
			}
		})
		.route({ method: "GET", path: "/statistics/timeline" }),
};

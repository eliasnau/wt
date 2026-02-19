import { ORPCError } from "@orpc/server";
import { and, count, db, eq, sql } from "@repo/db";
import { contract, group, groupMember, payment } from "@repo/db/schema";
import { after } from "next/server";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { logger } from "../lib/logger";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";

const monthSchema = z.object({
	month: z
		.string()
		.regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM")
		.optional(),
});

function formatDateUTC(date: Date) {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function getMonthRange(monthInput?: string) {
	const now = new Date();
	const currentMonth = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
	);
	const targetMonth = monthInput
		? new Date(
				Date.UTC(
					Number(monthInput.split("-")[0]),
					Number(monthInput.split("-")[1]) - 1,
					1,
				),
			)
		: currentMonth;

	if (targetMonth > currentMonth) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Month cannot be in the future",
		});
	}

	const nextMonth = new Date(
		Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 1),
	);
	const startDate = formatDateUTC(targetMonth);
	const nextMonthStartDate = formatDateUTC(nextMonth);

	return {
		startDate,
		nextMonthStartDate,
		month: formatDateUTC(targetMonth).slice(0, 7),
	};
}

export const statisticsRouter = {
	monthlyOverview: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(requirePermission({ member: ["view"], groups: ["view"] }))
		.input(monthSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			const { startDate, nextMonthStartDate, month } = getMonthRange(
				input.month,
			);

			try {
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
					Number(paymentTotals?.joiningFeeTotal ?? 0) +
					Number(paymentTotals?.yearlyFeeTotal ?? 0);

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
							total: item.total ?? "0",
						})),
					},
				};
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
};

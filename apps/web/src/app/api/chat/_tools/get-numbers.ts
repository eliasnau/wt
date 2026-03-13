import { and, count, db, eq, sql } from "@repo/db";
import { clubMember, contract, group, groupMember } from "@repo/db/schema";
import { tool } from "ai";
import { z } from "zod";

function getTodayInBerlinDateString(): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Berlin",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date());

	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parts.find((part) => part.type === "day")?.value;

	if (!year || !month || !day) {
		const now = new Date();
		return `${String(now.getFullYear()).padStart(4, "0")}-${String(
			now.getMonth() + 1,
		).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	}

	return `${year}-${month}-${day}`;
}

const getNumbersInputSchema = z.object({});

export const createGetNumbersTool = (organizationId: string) =>
	tool({
		description:
			"Get organization-level totals such as total groups, total members, total active members including cancellations not yet effective, and related summary counts.",
		inputSchema: getNumbersInputSchema,
		execute: async () => {
			const todayInBerlin = getTodayInBerlinDateString();

			const [
				totalGroups,
				totalMembers,
				totalActiveMembers,
				totalCancelledButActiveMembers,
				totalCancelledMembers,
				totalMembersWithGroups,
				totalMembersWithoutGroups,
				totalGroupAssignments,
			] = await Promise.all([
				db
					.select({ value: count() })
					.from(group)
					.where(eq(group.organizationId, organizationId))
					.then((rows) => rows[0]?.value ?? 0),
				db
					.select({ value: count() })
					.from(clubMember)
					.where(eq(clubMember.organizationId, organizationId))
					.then((rows) => rows[0]?.value ?? 0),
				db
					.select({ value: count() })
					.from(clubMember)
					.innerJoin(contract, eq(contract.memberId, clubMember.id))
					.where(
						and(
							eq(clubMember.organizationId, organizationId),
							sql`(
								${contract.cancellationEffectiveDate} is null
								or ${contract.cancellationEffectiveDate} >= ${todayInBerlin}
							)`,
						),
					)
					.then((rows) => rows[0]?.value ?? 0),
				db
					.select({ value: count() })
					.from(clubMember)
					.innerJoin(contract, eq(contract.memberId, clubMember.id))
					.where(
						and(
							eq(clubMember.organizationId, organizationId),
							sql`${contract.cancelledAt} is not null`,
							sql`(
								${contract.cancellationEffectiveDate} is null
								or ${contract.cancellationEffectiveDate} >= ${todayInBerlin}
							)`,
						),
					)
					.then((rows) => rows[0]?.value ?? 0),
				db
					.select({ value: count() })
					.from(clubMember)
					.innerJoin(contract, eq(contract.memberId, clubMember.id))
					.where(
						and(
							eq(clubMember.organizationId, organizationId),
							sql`${contract.cancelledAt} is not null`,
							sql`${contract.cancellationEffectiveDate} < ${todayInBerlin}`,
						),
					)
					.then((rows) => rows[0]?.value ?? 0),
				db
					.select({
						value: sql<number>`count(distinct ${groupMember.memberId})::int`,
					})
					.from(groupMember)
					.innerJoin(clubMember, eq(clubMember.id, groupMember.memberId))
					.where(eq(clubMember.organizationId, organizationId))
					.then((rows) => rows[0]?.value ?? 0),
				db
					.select({
						value: sql<number>`count(*)::int`,
					})
					.from(clubMember)
					.where(
						and(
							eq(clubMember.organizationId, organizationId),
							sql`not exists (
								select 1
								from ${groupMember}
								where ${groupMember.memberId} = ${clubMember.id}
							)`,
						),
					)
					.then((rows) => rows[0]?.value ?? 0),
				db
					.select({ value: count() })
					.from(groupMember)
					.innerJoin(group, eq(group.id, groupMember.groupId))
					.where(eq(group.organizationId, organizationId))
					.then((rows) => rows[0]?.value ?? 0),
			]);

			return {
				asOfDate: todayInBerlin,
				totals: {
					totalGroups,
					totalMembers,
					totalActiveMembers,
					totalCancelledButActiveMembers,
					totalCancelledMembers,
					totalMembersWithGroups,
					totalMembersWithoutGroups,
					totalGroupAssignments,
				},
				definitions: {
					totalActiveMembers:
						"Members whose cancellation effective date is today or later, including cancellations that are not yet effective.",
					totalCancelledButActiveMembers:
						"Members with a recorded cancellation that is not yet effective.",
					totalCancelledMembers:
						"Members whose cancellation effective date is already in the past.",
				},
			};
		},
	});

import { and, db, eq, ilike, inArray, or, sql } from "@repo/db";
import { clubMember, contract, group, groupMember } from "@repo/db/schema";
import { tool } from "ai";
import { z } from "zod";

export const membersToolInput = z.object({
	action: z.enum(["search", "count", "byGroup", "byId"]),
	query: z
		.string()
		.trim()
		.min(1)
		.max(100)
		.describe("Free-text search over name, email, phone. Use '*' for all.")
		.optional(),
	limit: z
		.number()
		.int()
		.min(1)
		.max(50)
		.describe("Maximum number of members to return.")
		.optional(),
	groupIds: z
		.array(z.string())
		.min(1)
		.max(10)
		.describe("Filter members that belong to ANY of these group IDs.")
		.optional(),
	memberId: z.string().describe("Exact member ID.").optional(),
});

const isPlaceholderId = (value: string) => {
	const compact = value.replaceAll("-", "");
	return compact.length > 0 && /^0+$/.test(compact);
};

const normalizeId = (value?: string) => {
	const normalized = value?.trim();
	if (!normalized || isPlaceholderId(normalized)) {
		return undefined;
	}
	return normalized;
};

const loadGroupsForMembers = async (memberIds: string[]) => {
	if (memberIds.length === 0)
		return new Map<string, { id: string; name: string }[]>();

	const rows = await db
		.select({
			memberId: groupMember.memberId,
			groupId: group.id,
			groupName: group.name,
		})
		.from(groupMember)
		.innerJoin(group, eq(group.id, groupMember.groupId))
		.where(inArray(groupMember.memberId, memberIds));

	const map = new Map<string, { id: string; name: string }[]>();

	for (const row of rows) {
		const list = map.get(row.memberId) ?? [];
		list.push({ id: row.groupId, name: row.groupName });
		map.set(row.memberId, list);
	}

	return map;
};

export const createMembersTool = (organizationId: string) =>
	tool({
		description:
			"Work with members of the current organization: search, count, get by group(s), or get by ID. Max 50 results. Use action 'search' for free-text queries, 'byGroup' for group-specific, 'count' for totals, 'byId' for single member details.",
		inputSchema: membersToolInput,
		execute: async ({ action, query, limit, groupIds, memberId }) => {
			const safeLimit = Math.min(limit ?? 20, 50);
			const normalizedQuery =
				query && query.trim() !== "*" ? query.trim() : undefined;
			const normalizedMemberId = normalizeId(memberId);
			const normalizedGroupIds = Array.from(
				new Set(
					(groupIds ?? []).map(normalizeId).filter((id): id is string => !!id),
				),
			);
			const searchFilter = normalizedQuery
				? (() => {
						const like = `%${normalizedQuery}%`;
						return or(
							ilike(clubMember.firstName, like),
							ilike(clubMember.lastName, like),
							ilike(clubMember.email, like),
							ilike(clubMember.phone, like),
							ilike(
								sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
								like,
							),
						);
					})()
				: undefined;

			const baseWhere = and(
				eq(clubMember.organizationId, organizationId),
				sql`EXISTS (
          SELECT 1 FROM ${contract}
          WHERE ${contract.memberId} = ${clubMember.id}
          AND (
            ${contract.cancellationEffectiveDate} IS NULL
            OR ${contract.cancellationEffectiveDate} >= CURRENT_DATE
          )
        )`,
			);

			if (action === "search") {
				const where = and(baseWhere, searchFilter);

				const members = await db
					.select({
						id: clubMember.id,
						firstName: clubMember.firstName,
						lastName: clubMember.lastName,
						email: clubMember.email,
						phone: clubMember.phone,
						joinedAt: clubMember.createdAt,
						contractStartDate: contract.startDate,
						contractInitialPeriod: contract.initialPeriod,
						contractNextBillingDate: contract.nextBillingDate,
						contractCurrentPeriodEndDate: contract.currentPeriodEndDate,
						contractCancellationEffectiveDate:
							contract.cancellationEffectiveDate,
					})
					.from(clubMember)
					.innerJoin(contract, eq(contract.memberId, clubMember.id))
					.where(where)
					.limit(safeLimit);

				const memberIds = members.map((member) => member.id);
				const groupsByMember = await loadGroupsForMembers(memberIds);

				return {
					mode: "search",
					count: members.length,
					members: members.map((member) => ({
						id: member.id,
						name: `${member.firstName} ${member.lastName}`.trim(),
						email: member.email,
						phone: member.phone,
						joinedAt: member.joinedAt,
						contract: {
							startDate: member.contractStartDate,
							initialPeriod: member.contractInitialPeriod,
							nextBillingDate: member.contractNextBillingDate,
							currentPeriodEndDate: member.contractCurrentPeriodEndDate,
							cancellationEffectiveDate:
								member.contractCancellationEffectiveDate,
						},
						groups: groupsByMember.get(member.id) ?? [],
					})),
				};
			}

			if (action === "count") {
				const where = and(baseWhere, searchFilter);

				const [{ value = 0 } = { value: 0 }] = await db
					.select({ value: sql<number>`count(*)` })
					.from(clubMember)
					.where(where);

				return {
					mode: "count",
					count: Number(value),
				};
			}

			if (action === "byGroup") {
				if (normalizedGroupIds.length === 0) {
					return {
						mode: "byGroup",
						error: "groupIds is required for action 'byGroup'.",
					};
				}

				const members = await db
					.select({
						id: clubMember.id,
						firstName: clubMember.firstName,
						lastName: clubMember.lastName,
						email: clubMember.email,
						phone: clubMember.phone,
						joinedAt: clubMember.createdAt,
					})
					.from(groupMember)
					.innerJoin(clubMember, eq(groupMember.memberId, clubMember.id))
					.where(
						and(
							baseWhere,
							inArray(groupMember.groupId, normalizedGroupIds),
							searchFilter,
						),
					)
					.limit(safeLimit);

				const uniqueMembers = Array.from(
					new Map(members.map((member) => [member.id, member])).values(),
				);

				const memberIds = uniqueMembers.map((member) => member.id);
				const groupsByMember = await loadGroupsForMembers(memberIds);

				return {
					mode: "byGroup",
					count: uniqueMembers.length,
					members: uniqueMembers.map((member) => ({
						id: member.id,
						name: `${member.firstName} ${member.lastName}`.trim(),
						email: member.email,
						phone: member.phone,
						joinedAt: member.joinedAt,
						groups: groupsByMember.get(member.id) ?? [],
					})),
				};
			}

			if (action === "byId") {
				if (!normalizedMemberId) {
					return {
						mode: "byId",
						error: "memberId is required for action 'byId'.",
					};
				}

				const member = await db
					.select({
						id: clubMember.id,
						firstName: clubMember.firstName,
						lastName: clubMember.lastName,
						email: clubMember.email,
						phone: clubMember.phone,
						street: clubMember.street,
						city: clubMember.city,
						state: clubMember.state,
						postalCode: clubMember.postalCode,
						country: clubMember.country,
						notes: clubMember.notes,
						guardianName: clubMember.guardianName,
						guardianEmail: clubMember.guardianEmail,
						guardianPhone: clubMember.guardianPhone,
						joinedAt: clubMember.createdAt,
						contractId: contract.id,
						contractInitialPeriod: contract.initialPeriod,
						contractStartDate: contract.startDate,
						contractInitialPeriodEndDate: contract.initialPeriodEndDate,
						contractCurrentPeriodEndDate: contract.currentPeriodEndDate,
						contractNextBillingDate: contract.nextBillingDate,
						contractJoiningFeeAmount: contract.joiningFeeAmount,
						contractYearlyFeeAmount: contract.yearlyFeeAmount,
						contractCancelledAt: contract.cancelledAt,
						contractCancellationEffectiveDate:
							contract.cancellationEffectiveDate,
						contractNotes: contract.notes,
					})
					.from(clubMember)
					.leftJoin(contract, eq(contract.memberId, clubMember.id))
					.where(
						and(
							eq(clubMember.organizationId, organizationId),
							eq(clubMember.id, normalizedMemberId),
						),
					)
					.limit(1);

				if (member.length === 0) {
					return {
						mode: "byId",
						found: false,
						message: "Member not found.",
					};
				}

				const selected = member[0];
				const memberGroups = await loadGroupsForMembers([selected.id]);

				return {
					mode: "byId",
					found: true,
					member: {
						id: selected.id,
						name: `${selected.firstName} ${selected.lastName}`.trim(),
						email: selected.email,
						phone: selected.phone,
						joinedAt: selected.joinedAt,
						address: {
							street: selected.street,
							city: selected.city,
							state: selected.state,
							postalCode: selected.postalCode,
							country: selected.country,
						},
						guardian: {
							name: selected.guardianName,
							email: selected.guardianEmail,
							phone: selected.guardianPhone,
						},
						notes: selected.notes,
						groups: memberGroups.get(selected.id) ?? [],
						contract: selected.contractId
							? {
									id: selected.contractId,
									initialPeriod: selected.contractInitialPeriod,
									startDate: selected.contractStartDate,
									initialPeriodEndDate: selected.contractInitialPeriodEndDate,
									currentPeriodEndDate: selected.contractCurrentPeriodEndDate,
									nextBillingDate: selected.contractNextBillingDate,
									joiningFeeAmount: selected.contractJoiningFeeAmount,
									yearlyFeeAmount: selected.contractYearlyFeeAmount,
									cancelledAt: selected.contractCancelledAt,
									cancellationEffectiveDate:
										selected.contractCancellationEffectiveDate,
									notes: selected.contractNotes,
								}
							: null,
					},
				};
			}

			return { error: "Unsupported action." };
		},
	});

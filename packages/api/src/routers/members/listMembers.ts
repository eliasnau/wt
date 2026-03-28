import { and, count, db, eq, ilike, inArray, or, sql } from "@repo/db";
import { clubMember, contract, group, groupMember } from "@repo/db/schema";
import { z } from "zod";

export const listMembersSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	groupIds: z.array(z.string()).optional(),
	options: z
		.object({
			includeCancelledMembers: z.boolean().optional(),
			memberStatus: z
				.enum(["active", "cancelled", "cancelled_but_active"])
				.optional(),
		})
		.optional(),
});

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

export async function listMembers({
	organizationId,
	input,
}: {
	organizationId: string;
	input: z.infer<typeof listMembersSchema>;
}) {
	const { page, limit } = input;
	const includeCancelled = input.options?.includeCancelledMembers ?? false;
	const memberStatus = input.options?.memberStatus;
	const todayInBerlin = getTodayInBerlinDateString();

	const rawSearch = input.search?.trim();
	const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

	const groupIds =
		input.groupIds
			?.map((g) => g.trim())
			.filter(Boolean)
			.filter((v, i, a) => a.indexOf(v) === i) ?? undefined;

	if ((input.groupIds?.length ?? 0) > 0 && (!groupIds || groupIds.length === 0)) {
		return {
			data: [],
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

	const offset = (page - 1) * limit;

	const statusFilterWhere =
		memberStatus === "active"
			? sql`${contract.cancelledAt} IS NULL`
			: memberStatus === "cancelled"
				? sql`${contract.cancelledAt} IS NOT NULL
                AND ${contract.cancellationEffectiveDate} IS NOT NULL
                AND ${contract.cancellationEffectiveDate} < ${todayInBerlin}`
				: memberStatus === "cancelled_but_active"
					? sql`${contract.cancelledAt} IS NOT NULL
                  AND (
                    ${contract.cancellationEffectiveDate} IS NULL
                    OR ${contract.cancellationEffectiveDate} >= ${todayInBerlin}
                  )`
					: includeCancelled
						? undefined
						: sql`(
                    ${contract.cancellationEffectiveDate} IS NULL
                    OR ${contract.cancellationEffectiveDate} >= ${todayInBerlin}
                  )`;

	const memberWhere = and(
		eq(clubMember.organizationId, organizationId),
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
		groupIds?.length
			? sql`${clubMember.id} in (
              select ${groupMember.memberId}
              from ${groupMember}
              where ${inArray(groupMember.groupId, groupIds)}
            )`
			: undefined,
		statusFilterWhere,
	);

	const members = await db
		.select({
			id: clubMember.id,
			firstName: clubMember.firstName,
			lastName: clubMember.lastName,
			birthdate: clubMember.birthdate,
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
			organizationId: clubMember.organizationId,
			createdAt: clubMember.createdAt,
			updatedAt: clubMember.updatedAt,
			contractId: contract.id,
			contractStartDate: contract.startDate,
			contractStatus: contract.status,
			contractInitialPeriod: contract.initialPeriod,
			contractInitialPeriodEndDate: contract.initialPeriodEndDate,
			contractJoiningFeeCents: contract.joiningFeeCents,
			contractYearlyFeeCents: contract.yearlyFeeCents,
			contractNotes: contract.notes,
			contractCancelledAt: contract.cancelledAt,
			contractCancellationEffectiveDate: contract.cancellationEffectiveDate,
		})
		.from(clubMember)
		.innerJoin(contract, eq(contract.memberId, clubMember.id))
		.where(memberWhere)
		.limit(limit)
		.offset(offset);

	const [{ count: totalCount = 0 } = { count: 0 }] = await db
		.select({ count: count() })
		.from(clubMember)
		.innerJoin(contract, eq(contract.memberId, clubMember.id))
		.where(memberWhere);

	const totalPages = Math.ceil(totalCount / limit);
	const memberIds = members.map((member) => member.id);
	let groupMap = new Map<
		string,
		{
			groupId: string;
			membershipPriceCents: number;
			group: { id: string; name: string; color: string };
		}[]
	>();

	if (memberIds.length > 0) {
		const groupMembershipRows = await db
			.select({
				memberId: groupMember.memberId,
				groupId: groupMember.groupId,
				membershipPriceCents: groupMember.membershipPriceCents,
				groupEntityId: group.id,
				groupName: group.name,
				groupColor: group.color,
			})
			.from(groupMember)
			.innerJoin(group, eq(group.id, groupMember.groupId))
			.where(inArray(groupMember.memberId, memberIds));

		groupMap = groupMembershipRows.reduce(
			(accumulator, row) => {
				const currentGroups = accumulator.get(row.memberId) ?? [];
				currentGroups.push({
					groupId: row.groupId,
					membershipPriceCents: row.membershipPriceCents,
					group: {
						id: row.groupEntityId,
						name: row.groupName,
						color: row.groupColor,
					},
				});
				accumulator.set(row.memberId, currentGroups);
				return accumulator;
			},
			new Map<
				string,
				{
					groupId: string;
					membershipPriceCents: number;
					group: { id: string; name: string; color: string };
				}[]
			>(),
		);
	}

	const data = members.map((member) => {
		const {
			contractId,
			contractStartDate,
			contractStatus,
			contractInitialPeriod,
			contractInitialPeriodEndDate,
			contractJoiningFeeCents,
			contractYearlyFeeCents,
			contractNotes,
			contractCancelledAt,
			contractCancellationEffectiveDate,
			...memberData
		} = member;

		return {
			...memberData,
			contract: {
				id: contractId,
				startDate: contractStartDate,
				status: contractStatus,
				initialPeriod: contractInitialPeriod,
				initialPeriodEndDate: contractInitialPeriodEndDate,
				joiningFeeCents: contractJoiningFeeCents,
				yearlyFeeCents: contractYearlyFeeCents,
				notes: contractNotes,
				cancelledAt: contractCancelledAt,
				cancellationEffectiveDate: contractCancellationEffectiveDate,
			},
			groupMembers: groupMap.get(member.id) ?? [],
		};
	});

	return {
		data,
		pagination: {
			page,
			limit,
			totalCount,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
		},
	};
}

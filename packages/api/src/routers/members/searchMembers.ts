import { and, asc, db, eq, ilike, inArray, or, sql } from "@repo/db";
import { clubMember, contract, group, groupMember } from "@repo/db/schema";
import { z } from "zod";

export const searchMembersSchema = z.object({
	query: z.string().trim().min(1),
	limit: z.coerce.number().int().min(1).max(20).default(8),
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

export async function searchMembers({
	organizationId,
	input,
}: {
	organizationId: string;
	input: z.infer<typeof searchMembersSchema>;
}) {
	const normalizedQuery = input.query.trim();

	if (normalizedQuery.length <= 4) {
		return { data: [] };
	}

	const todayInBerlin = getTodayInBerlinDateString();

	const members = await db
		.select({
			id: clubMember.id,
			firstName: clubMember.firstName,
			lastName: clubMember.lastName,
		})
		.from(clubMember)
		.innerJoin(contract, eq(contract.memberId, clubMember.id))
		.where(
			and(
				eq(clubMember.organizationId, organizationId),
				or(
					ilike(clubMember.firstName, `%${normalizedQuery}%`),
					ilike(clubMember.lastName, `%${normalizedQuery}%`),
					ilike(
						sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
						`%${normalizedQuery}%`,
					),
				),
				sql`(
					${contract.cancellationEffectiveDate} IS NULL
					OR ${contract.cancellationEffectiveDate} >= ${todayInBerlin}
				)`,
			),
		)
		.orderBy(asc(clubMember.lastName), asc(clubMember.firstName))
		.limit(input.limit);

	const memberIds = members.map((member) => member.id);

	if (memberIds.length === 0) {
		return { data: [] };
	}

	const groupRows = await db
		.select({
			memberId: groupMember.memberId,
			groupName: group.name,
		})
		.from(groupMember)
		.innerJoin(group, eq(group.id, groupMember.groupId))
		.where(inArray(groupMember.memberId, memberIds))
		.orderBy(asc(group.name));

	const groupsByMemberId = groupRows.reduce((acc, row) => {
		const current = acc.get(row.memberId) ?? [];
		current.push(row.groupName);
		acc.set(row.memberId, current);
		return acc;
	}, new Map<string, string[]>());

	return {
		data: members.map((member) => ({
			id: member.id,
			name: `${member.firstName} ${member.lastName}`.trim(),
			groups: groupsByMemberId.get(member.id) ?? [],
		})),
	};
}

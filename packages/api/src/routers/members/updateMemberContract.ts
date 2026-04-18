import { ORPCError } from "@orpc/server";
import { and, db, desc, eq } from "@repo/db";
import { contract } from "@repo/db/schema";
import { z } from "zod";

const ACTIVE_CONTRACT_STATUSES = new Set(["active", "cancelled"]);

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

export const updateMemberContractSchema = z.object({
	memberId: z.string().uuid(),
	joiningFeeCents: z.number().int().nonnegative().optional(),
	yearlyFeeCents: z.number().int().nonnegative().optional(),
});

export async function updateCurrentMemberContract({
	organizationId,
	...input
}: z.infer<typeof updateMemberContractSchema> & {
	organizationId: string;
}) {
	const todayInBerlin = getTodayInBerlinDateString();

	const [contractRow] = await db
		.select({
			id: contract.id,
			status: contract.status,
			cancellationEffectiveDate: contract.cancellationEffectiveDate,
		})
		.from(contract)
		.where(
			and(
				eq(contract.memberId, input.memberId),
				eq(contract.organizationId, organizationId),
			),
		)
		.orderBy(desc(contract.startDate), desc(contract.createdAt))
		.limit(1);

	if (!contractRow) {
		throw new ORPCError("NOT_FOUND", {
			message: "Contract not found",
		});
	}

	const isCurrentContract =
		ACTIVE_CONTRACT_STATUSES.has(contractRow.status) &&
		(!contractRow.cancellationEffectiveDate ||
			contractRow.cancellationEffectiveDate >= todayInBerlin);

	if (!isCurrentContract) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Contract can only be updated for active members",
		});
	}

	const [updatedContract] = await db
		.update(contract)
		.set({
			joiningFeeCents: input.joiningFeeCents,
			yearlyFeeCents: input.yearlyFeeCents,
		})
		.where(
			and(
				eq(contract.id, contractRow.id),
				eq(contract.organizationId, organizationId),
			),
		)
		.returning();

	if (!updatedContract) {
		throw new ORPCError("NOT_FOUND", {
			message: "Contract not found",
		});
	}

	return updatedContract;
}

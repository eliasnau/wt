import { ORPCError } from "@orpc/server";
import { and, db, eq, isNull } from "@repo/db";
import { contract } from "@repo/db/schema";
import { z } from "zod";

export const cancelContractSchema = z.object({
	memberId: z.string(),
	cancelReason: z.string().min(1, "Cancel reason is required").max(1000),
	cancellationEffectiveDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)"),
});

type DateParts = {
	year: number;
	month: number;
	day: number;
};

function parseDateOnly(dateStr: string): DateParts | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (!year || month < 1 || month > 12) return null;

	const daysInMonth = new Date(year, month, 0).getDate();
	if (day < 1 || day > daysInMonth) return null;

	return { year, month, day };
}

function getLastDayOfMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

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

export async function cancelMemberContract({
	organizationId,
	memberId,
	cancelReason,
	cancellationEffectiveDate,
}: z.infer<typeof cancelContractSchema> & {
	organizationId: string;
}) {
	const effectiveDateParts = parseDateOnly(cancellationEffectiveDate);
	if (!effectiveDateParts) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid cancellation effective date",
		});
	}

	const isLastDayOfMonth =
		effectiveDateParts.day ===
		getLastDayOfMonth(effectiveDateParts.year, effectiveDateParts.month);
	if (!isLastDayOfMonth) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Cancellation effective date must be the last day of the month",
		});
	}

	const todayInBerlin = getTodayInBerlinDateString();
	if (cancellationEffectiveDate <= todayInBerlin) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Cancellation effective date must be in the future",
		});
	}

	const [existingContract] = await db
		.select()
		.from(contract)
		.where(
			and(
				eq(contract.memberId, memberId),
				eq(contract.organizationId, organizationId),
			),
		)
		.limit(1);

	if (!existingContract) {
		throw new ORPCError("NOT_FOUND", {
			message: "Contract not found for this member",
		});
	}

	if (existingContract.cancelledAt) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Contract is already cancelled",
		});
	}

	if (
		existingContract.initialPeriodEndDate &&
		cancellationEffectiveDate < existingContract.initialPeriodEndDate
	) {
		throw new ORPCError("BAD_REQUEST", {
			message: `Initial period ends on ${existingContract.initialPeriodEndDate}. Cancellation effective date must be on or after that date.`,
		});
	}

	const [updatedContract] = await db
		.update(contract)
		.set({
			status: "cancelled",
			cancelledAt: new Date(),
			cancellationReason: cancelReason,
			cancellationEffectiveDate,
		})
		.where(and(eq(contract.id, existingContract.id), isNull(contract.cancelledAt)))
		.returning();

	if (!updatedContract) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Contract is already cancelled",
		});
	}

	return updatedContract;
}

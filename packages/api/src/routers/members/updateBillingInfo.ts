import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, isNull, wsDb } from "@repo/db";
import { contract, sepaMandate } from "@repo/db/schema";
import { z } from "zod";
import { loadSepaModule } from "../../lib/sepa";

const ACTIVE_CONTRACT_STATUSES = new Set(["active", "cancelled"]);

export const updateBillingInfoSchema = z.object({
	memberId: z.string().uuid(),
	accountHolder: z.string().trim().min(1).max(255),
	iban: z.string().trim().min(1),
	bic: z.string().trim().min(1),
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

function generateMandateId(): string {
	return `WT-${randomBytes(12).toString("hex").toUpperCase()}`;
}

export async function createMandateForBillingInfo({
	organizationId,
	memberId,
	accountHolder,
	iban,
	bic,
}: z.infer<typeof updateBillingInfoSchema> & {
	organizationId: string;
}) {
	const normalizedIban = iban.replace(/\s+/g, "").toUpperCase();
	const normalizedBic = bic.replace(/\s+/g, "").toUpperCase();

	const sepa = await loadSepaModule();
	if (!sepa.validateIBAN(normalizedIban)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid IBAN",
		});
	}

	const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
	if (!bicRegex.test(normalizedBic)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid BIC",
		});
	}

	const todayInBerlin = getTodayInBerlinDateString();
	const [contractRow] = await wsDb
		.select({
			id: contract.id,
			status: contract.status,
			cancellationEffectiveDate: contract.cancellationEffectiveDate,
		})
		.from(contract)
		.where(
			and(
				eq(contract.organizationId, organizationId),
				eq(contract.memberId, memberId),
			),
		)
		.orderBy(desc(contract.startDate), desc(contract.createdAt))
		.limit(1);

	if (!contractRow) {
		throw new ORPCError("NOT_FOUND", {
			message: "No contract found for member",
		});
	}

	const isCurrentContract =
		ACTIVE_CONTRACT_STATUSES.has(contractRow.status) &&
		(!contractRow.cancellationEffectiveDate ||
			contractRow.cancellationEffectiveDate >= todayInBerlin);
	if (!isCurrentContract) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Billing info can only be updated for active contracts",
		});
	}

	return wsDb.transaction(async (tx) => {
		await tx
			.update(sepaMandate)
			.set({
				isActive: false,
				revokedAt: new Date(),
			})
			.where(
				and(
					eq(sepaMandate.organizationId, organizationId),
					eq(sepaMandate.memberId, memberId),
					eq(sepaMandate.contractId, contractRow.id),
					eq(sepaMandate.isActive, true),
					isNull(sepaMandate.revokedAt),
				),
			);

		const [createdMandate] = await tx
			.insert(sepaMandate)
			.values({
				organizationId,
				memberId,
				contractId: contractRow.id,
				mandateReference: generateMandateId(),
				accountHolder: accountHolder.trim(),
				iban: normalizedIban,
				bic: normalizedBic,
				signatureDate: todayInBerlin,
				isActive: true,
			})
			.returning();

		if (!createdMandate) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to create mandate",
			});
		}

		return {
			contractId: contractRow.id,
			mandate: createdMandate,
		};
	});
}

import { and, db, eq, isNull } from "@repo/db";
import { clubMember, contract, sepaMandate } from "@repo/db/schema";
import { loadSepaModule } from "../../lib/sepa";

function normalizeIban(value: string | null | undefined): string {
	return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

function normalizeBic(value: string | null | undefined): string {
	return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

function normalizeRequiredText(value: string | null | undefined): string {
	return (value ?? "").trim();
}

export async function validateSepaMembers({
	organizationId,
}: {
	organizationId: string;
}) {
	const sepa = await loadSepaModule();
	const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;

	const rows = await db
		.select({
			memberId: clubMember.id,
			firstName: clubMember.firstName,
			lastName: clubMember.lastName,
			email: clubMember.email,
			iban: sepaMandate.iban,
			bic: sepaMandate.bic,
			cardHolder: sepaMandate.accountHolder,
			mandateId: sepaMandate.mandateReference,
			mandateSignatureDate: sepaMandate.signatureDate,
			contractCancelledAt: contract.cancelledAt,
		})
		.from(clubMember)
		.innerJoin(contract, eq(contract.memberId, clubMember.id))
		.leftJoin(
			sepaMandate,
			and(
				eq(sepaMandate.contractId, contract.id),
				eq(sepaMandate.isActive, true),
				isNull(sepaMandate.revokedAt),
			),
		)
		.where(
			and(
				eq(clubMember.organizationId, organizationId),
				eq(contract.organizationId, organizationId),
			),
		)
		.orderBy(clubMember.lastName, clubMember.firstName);

	const members = rows.map((row) => {
		const memberName = `${row.firstName} ${row.lastName}`.trim();
		const iban = normalizeIban(row.iban);
		const bic = normalizeBic(row.bic);
		const cardHolder = normalizeRequiredText(row.cardHolder);
		const mandateId = normalizeRequiredText(row.mandateId);
		const reasons: string[] = [];

		if (!iban) reasons.push("missing IBAN");
		else if (!sepa.validateIBAN(iban)) reasons.push("invalid IBAN");

		if (!bic) reasons.push("missing BIC");
		else if (!bicRegex.test(bic)) reasons.push("invalid BIC");

		if (!cardHolder) reasons.push("missing account holder");
		if (!mandateId) reasons.push("missing mandate ID");
		if (!row.mandateSignatureDate) reasons.push("missing mandate signature date");

		return {
			memberId: row.memberId,
			memberName,
			email: row.email,
			contractCancelledAt: row.contractCancelledAt,
			valid: reasons.length === 0,
			reasons,
		};
	});

	const invalidMembers = members
		.filter((member) => !member.valid)
		.map((member) => ({
			memberId: member.memberId,
			memberName: member.memberName,
			reasons: member.reasons,
		}));

	return {
		total: members.length,
		validCount: members.length - invalidMembers.length,
		invalidCount: invalidMembers.length,
		members,
		invalidMembers,
	};
}

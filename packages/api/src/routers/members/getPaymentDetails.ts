import { ORPCError } from "@orpc/server";
import { DB } from "@repo/db/functions";

export async function getMemberPaymentDetails({
	organizationId,
	memberId,
}: {
	organizationId: string;
	memberId: string;
}) {
	const member = await DB.query.members.getMembersPaymentInfo({
		id: memberId,
	});

	if (!member || member.organizationId !== organizationId) {
		throw new ORPCError("NOT_FOUND", {
			message: "Member not found",
		});
	}

	return {
		memberId: member.id,
		iban: member.iban,
		bic: member.bic,
		cardHolder: member.cardHolder,
	};
}

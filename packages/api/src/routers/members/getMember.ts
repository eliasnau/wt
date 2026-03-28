import { ORPCError } from "@orpc/server";
import { DB } from "@repo/db/functions";
import { z } from "zod";

export const getMemberSchema = z.object({
	memberId: z.string(),
});

export async function getMemberById({
	organizationId,
	memberId,
}: z.infer<typeof getMemberSchema> & {
	organizationId: string;
}) {
	const member = await DB.query.members.getMemberWithDetails({
		memberId,
	});

	if (!member || member.organizationId !== organizationId) {
		throw new ORPCError("NOT_FOUND", {
			message: "Member not found",
		});
	}

	return member;
}

import { z } from "zod";

export const memberSensitiveFieldSchema = z.enum([
	"birthdate",
	"email",
	"phone",
]);

export const memberSensitiveFieldsInputSchema = z
	.array(memberSensitiveFieldSchema)
	.max(3)
	.optional()
	.describe(
		"Optional sensitive member fields to reveal in the result. Only request birthdate, email, or phone when the user explicitly needs those details.",
	);

export type MemberSensitiveField = z.infer<typeof memberSensitiveFieldSchema>;

export function shouldRequireMemberContactApproval(
	includeFields: MemberSensitiveField[] | undefined,
) {
	return Boolean(
		includeFields?.some(
			(field) =>
				field === "birthdate" || field === "email" || field === "phone",
		),
	);
}

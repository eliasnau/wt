import { z } from "zod";

export const memberSensitiveFieldSchema = z.enum(["email", "phone"]);

export const memberSensitiveFieldsInputSchema = z
	.array(memberSensitiveFieldSchema)
	.max(2)
	.optional()
	.describe(
		"Optional sensitive member fields to reveal in the result. Only request email or phone when the user explicitly needs contact details.",
	);

export type MemberSensitiveField = z.infer<typeof memberSensitiveFieldSchema>;

export function shouldRequireMemberContactApproval(
	includeFields: MemberSensitiveField[] | undefined,
) {
	return Boolean(
		includeFields?.some((field) => field === "email" || field === "phone"),
	);
}


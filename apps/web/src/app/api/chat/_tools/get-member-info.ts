import { DB } from "@repo/db/functions";
import { tool } from "ai";
import { z } from "zod";
import {
	memberSensitiveFieldsInputSchema,
	shouldRequireMemberContactApproval,
	type MemberSensitiveField,
} from "./member-sensitive-fields";

const getMemberInfoInputSchema = z.object({
	memberId: z
		.string()
		.trim()
		.min(1)
		.describe(
			"Exact member ID. Resolve the member with queryMembers first if needed.",
		),
	includeFields: memberSensitiveFieldsInputSchema,
});

export const createGetMemberInfoTool = (organizationId: string) =>
	tool({
		description:
			"Get detailed information for a single member by exact member ID. Use only after you have resolved the correct member ID. Member birthdate, email, and phone are sensitive and must be explicitly requested via includeFields only when needed.",
		inputSchema: getMemberInfoInputSchema,
		needsApproval: ({ includeFields }) =>
			shouldRequireMemberContactApproval(includeFields),
		execute: async ({ memberId, includeFields }) => {
			const member = await DB.query.members.getMemberWithDetails({ memberId });
			const includeFieldSet = new Set<MemberSensitiveField>(includeFields ?? []);

			if (!member || member.organizationId !== organizationId) {
				return {
					found: false,
					message: "Member not found.",
				};
			}

			return {
				found: true,
				member: {
					id: member.id,
					name: `${member.firstName} ${member.lastName}`.trim(),
					firstName: member.firstName,
					lastName: member.lastName,
					birthdate: includeFieldSet.has("birthdate")
						? member.birthdate
						: undefined,
					email: includeFieldSet.has("email") ? member.email : undefined,
					phone: includeFieldSet.has("phone") ? member.phone : undefined,
					guardian: {
						name: member.guardianName,
					},
					notes: member.notes,
					createdAt: member.createdAt,
					updatedAt: member.updatedAt,
					contract: member.contract,
					groups: member.groups.map((entry) => ({
						id: entry.group.id,
						name: entry.group.name,
						description: entry.group.description,
						color: entry.group.color,
						defaultMembershipPrice: entry.group.defaultMembershipPrice,
						membershipPrice: entry.membershipPrice,
						joinedAt: entry.joinedAt,
					})),
				},
			};
		},
	});

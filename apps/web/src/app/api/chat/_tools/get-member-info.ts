import { DB } from "@repo/db/functions";
import { tool } from "ai";
import { z } from "zod";

const getMemberInfoInputSchema = z.object({
	memberId: z
		.string()
		.trim()
		.min(1)
		.describe(
			"Exact member ID. Resolve the member with queryMembers first if needed.",
		),
});

export const createGetMemberInfoTool = (organizationId: string) =>
	tool({
		description:
			"Get detailed information for a single member by exact member ID. Use only after you have resolved the correct member ID.",
		inputSchema: getMemberInfoInputSchema,
		execute: async ({ memberId }) => {
			const member = await DB.query.members.getMemberWithDetails({ memberId });

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
					birthdate: member.birthdate,
					email: member.email,
					phone: member.phone,
					guardian: {
						name: member.guardianName,
						email: member.guardianEmail,
						phone: member.guardianPhone,
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

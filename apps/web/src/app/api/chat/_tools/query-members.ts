import { listMembersAdvanced } from "@repo/api/routers/members/listMembersAdvanced";
import { tool } from "ai";
import { z } from "zod";

const memberFilterFieldSchema = z.enum([
	"firstName",
	"lastName",
	"fullName",
	"birthdate",
	"email",
	"phone",
	"city",
	"notes",
	"startDate",
	"cancellationEffectiveDate",
	"cancelReason",
	"groupCount",
]);

const memberValueFilterSchema = z.object({
	field: memberFilterFieldSchema,
	operator: z.enum([
		"contains",
		"eq",
		"neq",
		"startsWith",
		"endsWith",
		"gte",
		"lte",
	]),
	value: z.string().trim().min(1),
});

const memberInFilterSchema = z.object({
	field: memberFilterFieldSchema,
	operator: z.literal("in"),
	value: z.array(z.string().trim().min(1)).min(1).max(20),
});

const memberNullFilterSchema = z.object({
	field: memberFilterFieldSchema,
	operator: z.enum(["isNull", "isNotNull"]),
});

const memberFilterSchema = z.union([
	memberValueFilterSchema,
	memberInFilterSchema,
	memberNullFilterSchema,
]);

const queryMembersInputSchema = z.object({
	page: z.number().int().min(1).max(50).default(1).optional(),
	limit: z.number().int().min(1).max(25).default(10).optional(),
	search: z
		.string()
		.trim()
		.min(1)
		.max(100)
		.describe(
			"Free text search across member names, email, phone, city, notes, and contract fields.",
		)
		.optional(),
	groupIds: z
		.array(z.string().trim().min(1))
		.max(10)
		.describe("Exact group IDs. Resolve group names with listGroups first.")
		.optional(),
	memberIds: z.array(z.string().trim().min(1)).max(25).optional(),
	status: z
		.object({
			includeActive: z.boolean().optional(),
			includeCancelled: z.boolean().optional(),
			includeCancelledButActive: z.boolean().optional(),
		})
		.optional(),
	sort: z
		.object({
			field: z
				.enum([
					"createdAt",
					"updatedAt",
					"firstName",
					"lastName",
					"fullName",
					"birthdate",
					"email",
					"city",
					"startDate",
					"cancellationEffectiveDate",
					"cancelledAt",
				])
				.optional(),
			direction: z.enum(["asc", "desc"]).optional(),
		})
		.optional(),
	filterMode: z.enum(["and", "or"]).optional(),
	filters: z.array(memberFilterSchema).max(12).optional(),
});

type QueryMembersInput = z.infer<typeof queryMembersInputSchema>;

export const createQueryMembersTool = (organizationId: string) =>
	tool({
		description:
			"Search and filter members for the current organization. Use this for member lists, lookups by name/email/phone, group-filtered searches, and paginated filtering. If the user names a group, resolve it with listGroups first and then pass the group ID here.",
		inputSchema: queryMembersInputSchema,
		execute: async (input: QueryMembersInput) => {
			const result = await listMembersAdvanced({
				organizationId,
				input: {
					page: input.page ?? 1,
					limit: input.limit ?? 10,
					search: input.search,
					groupIds: input.groupIds,
					memberIds: input.memberIds,
					status: input.status,
					sort: input.sort,
					filterMode: input.filterMode,
					filters: input.filters,
				},
			});

			return {
				pagination: result.pagination,
				members: result.data.map((member) => ({
					id: member.id,
					name: `${member.firstName} ${member.lastName}`.trim(),
					firstName: member.firstName,
					lastName: member.lastName,
					birthdate: member.birthdate,
					email: member.email,
					phone: member.phone,
					city: member.city,
					membershipStatus: member.membershipStatus,
					contract: {
						startDate: member.contract.startDate,
						initialPeriod: member.contract.initialPeriod,
						cancelledAt: member.contract.cancelledAt,
						cancelReason: member.contract.cancelReason,
						cancellationEffectiveDate:
							member.contract.cancellationEffectiveDate,
					},
					groups: member.groupMembers.map((groupMember) => ({
						id: groupMember.group.id,
						name: groupMember.group.name,
						color: groupMember.group.color,
						membershipPrice: groupMember.membershipPrice,
					})),
				})),
			};
		},
	});

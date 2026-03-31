import {
	listMembersAdvanced,
	listMembersAdvancedForExport,
} from "@repo/api/routers/members/listMembersAdvanced";
import { tool } from "ai";
import { z } from "zod";
import {
	memberSensitiveFieldsInputSchema,
	shouldRequireMemberContactApproval,
	type MemberSensitiveField,
} from "./member-sensitive-fields";

const memberFilterFieldSchema = z.enum([
	"firstName",
	"lastName",
	"fullName",
	"birthdate",
	"email",
	"phone",
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
		.preprocess((value) => {
			if (typeof value !== "string") {
				return value;
			}

			const trimmed = value.trim();
			return trimmed.length === 0 ? undefined : trimmed;
		}, z.string().max(100).optional())
		.describe(
			"Free text search across member names, email, phone, notes, and contract fields.",
		),
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
	contractEndingWithinDays: z
		.number()
		.int()
		.min(0)
		.max(365)
		.describe(
			"Filter to members whose contract current period end date is within the next N days.",
		)
		.optional(),
	contractEndDateFrom: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.describe("Inclusive start date for contract current period end date.")
		.optional(),
	contractEndDateTo: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.describe("Inclusive end date for contract current period end date.")
		.optional(),
	includeFields: memberSensitiveFieldsInputSchema,
});

type QueryMembersInput = z.infer<typeof queryMembersInputSchema>;

function normalizeContractEndDateFilter(
	value: string | undefined,
): string | undefined {
	if (!value) {
		return undefined;
	}

	const trimmed = value.trim();
	if (
		trimmed.length === 0 ||
		trimmed === "0000-00-00" ||
		trimmed === "9999-12-31"
	) {
		return undefined;
	}

	return trimmed;
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

function addDays(dateString: string, days: number) {
	const [year, month, day] = dateString.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	date.setUTCDate(date.getUTCDate() + days);
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
		2,
		"0",
	)}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function mapMember(
	member: Awaited<ReturnType<typeof listMembersAdvanced>>["data"][number],
	includeFieldSet: Set<MemberSensitiveField>,
) {
	return {
		id: member.id,
		name: `${member.firstName} ${member.lastName}`.trim(),
		firstName: member.firstName,
		lastName: member.lastName,
		birthdate: includeFieldSet.has("birthdate")
			? member.birthdate
			: undefined,
		email: includeFieldSet.has("email") ? member.email : undefined,
		phone: includeFieldSet.has("phone") ? member.phone : undefined,
		membershipStatus: member.membershipStatus,
		contract: {
			startDate: member.contract.startDate,
			status: member.contract.status,
			initialPeriod: member.contract.initialPeriod,
			initialPeriodEndDate: member.contract.initialPeriodEndDate,
			cancelledAt: member.contract.cancelledAt,
			cancelReason: member.contract.cancelReason,
			cancellationEffectiveDate: member.contract.cancellationEffectiveDate,
		},
		groups: member.groupMembers.map((groupMember) => ({
			id: groupMember.group.id,
			name: groupMember.group.name,
			color: groupMember.group.color,
			membershipPriceCents: groupMember.membershipPriceCents,
		})),
	};
}

export const createQueryMembersTool = (organizationId: string) =>
	tool({
		description:
			"Search and filter members for the current organization. Use this for member lists, lookups by name/email/phone, group-filtered searches, paginated filtering, and contract end date queries. For questions about a member's birthday or birth month/day, first resolve the member with search or filters, and only request includeFields: ['birthdate'] when the user explicitly wants the birthdate returned. If the user names a group, resolve it with listGroups first and then pass the group ID here. Member birthdate, email, and phone are sensitive and must be explicitly requested via includeFields only when needed.",
		inputSchema: queryMembersInputSchema,
		execute: async (input: QueryMembersInput) => {
			const includeFieldSet = new Set<MemberSensitiveField>(
				input.includeFields ?? [],
			);
			const normalizedContractEndDateFrom = normalizeContractEndDateFilter(
				input.contractEndDateFrom,
			);
			const normalizedContractEndDateTo = normalizeContractEndDateFilter(
				input.contractEndDateTo,
			);
			const contractEndingWithinDays =
				typeof input.contractEndingWithinDays === "number" &&
				input.contractEndingWithinDays > 0
					? input.contractEndingWithinDays
					: undefined;
			const contractEndDateFrom =
				normalizedContractEndDateFrom ??
				(typeof contractEndingWithinDays === "number"
					? getTodayInBerlinDateString()
					: undefined);
			const contractEndDateTo =
				normalizedContractEndDateTo ??
				(typeof contractEndingWithinDays === "number"
					? addDays(
							getTodayInBerlinDateString(),
							contractEndingWithinDays,
						)
					: undefined);

			const hasContractEndFilter =
				typeof contractEndDateFrom === "string" ||
				typeof contractEndDateTo === "string";

			if (hasContractEndFilter) {
				const page = input.page ?? 1;
				const limit = input.limit ?? 10;
				const exportResult = await listMembersAdvancedForExport({
					organizationId,
					input: {
						search: input.search,
						groupIds: input.groupIds,
						memberIds: input.memberIds,
						status: input.status,
						sort: input.sort,
						filterMode: input.filterMode,
						filters: input.filters,
					},
					maxRows: 10_000,
				});

				const filteredMembers = exportResult.data
					.filter((member) => {
						const endDate = member.contract.initialPeriodEndDate;
						if (!endDate) {
							return false;
						}

						if (contractEndDateFrom && endDate < contractEndDateFrom) {
							return false;
						}

						if (contractEndDateTo && endDate > contractEndDateTo) {
							return false;
						}

						return true;
					})
					.sort((a, b) =>
						a.contract.initialPeriodEndDate.localeCompare(
							b.contract.initialPeriodEndDate,
						),
					);

				const totalCount = filteredMembers.length;
				const totalPages = Math.ceil(totalCount / limit);
				const paginatedMembers = filteredMembers.slice(
					(page - 1) * limit,
					page * limit,
				);

				return {
					pagination: {
						page,
						limit,
						totalCount,
						totalPages,
						hasNextPage: page < totalPages,
						hasPreviousPage: page > 1,
					},
					appliedContractEndDateFilter: {
						from: contractEndDateFrom,
						to: contractEndDateTo,
					},
					members: paginatedMembers.map((member) =>
						mapMember(member, includeFieldSet),
					),
				};
			}

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
				members: result.data.map((member) =>
					mapMember(member, includeFieldSet),
				),
			};
		},
		needsApproval: ({ includeFields }) =>
			shouldRequireMemberContactApproval(includeFields),
	});

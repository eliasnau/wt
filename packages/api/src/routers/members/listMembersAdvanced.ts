import { and, count, db, eq, ilike, inArray, or, sql } from "@repo/db";
import { clubMember, contract, group, groupMember } from "@repo/db/schema";
import { z } from "zod";

const filterFieldSchema = z.enum([
	"firstName",
	"lastName",
	"fullName",
	"email",
	"phone",
	"street",
	"city",
	"state",
	"postalCode",
	"country",
	"notes",
	"guardianName",
	"guardianEmail",
	"guardianPhone",
	"initialPeriod",
	"cancelReason",
	"startDate",
	"cancellationEffectiveDate",
	"cancelledAt",
]);

const valueFilterSchema = z.object({
	field: filterFieldSchema,
	operator: z.enum([
		"contains",
		"eq",
		"neq",
		"startsWith",
		"endsWith",
		"gte",
		"lte",
	]),
	value: z.string().min(1),
});

const inFilterSchema = z.object({
	field: filterFieldSchema,
	operator: z.literal("in"),
	value: z.array(z.string().min(1)).min(1),
});

const nullFilterSchema = z.object({
	field: filterFieldSchema,
	operator: z.enum(["isNull", "isNotNull"]),
});

const advancedFilterSchema = z.union([
	valueFilterSchema,
	inFilterSchema,
	nullFilterSchema,
]);

const sortFieldSchema = z.enum([
	"createdAt",
	"updatedAt",
	"firstName",
	"lastName",
	"fullName",
	"email",
	"city",
	"startDate",
	"cancellationEffectiveDate",
	"cancelledAt",
]);

export const listMembersAdvancedSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	groupIds: z.array(z.string()).optional(),
	status: z
		.object({
			includeActive: z.boolean().optional(),
			includeCancelled: z.boolean().optional(),
			includeCancelledButActive: z.boolean().optional(),
		})
		.optional(),
	sort: z
		.object({
			field: sortFieldSchema.optional(),
			direction: z.enum(["asc", "desc"]).optional(),
		})
		.optional(),
	filterMode: z.enum(["and", "or"]).optional(),
	filters: z.array(advancedFilterSchema).optional(),
});

export const listMembersAdvancedExportSchema = listMembersAdvancedSchema.omit({
	page: true,
	limit: true,
});

export type ListMembersAdvancedInput = z.infer<
	typeof listMembersAdvancedSchema
>;
export type ListMembersAdvancedExportInput = z.infer<
	typeof listMembersAdvancedExportSchema
>;

const memberSelect = {
	id: clubMember.id,
	firstName: clubMember.firstName,
	lastName: clubMember.lastName,
	email: clubMember.email,
	phone: clubMember.phone,
	street: clubMember.street,
	city: clubMember.city,
	state: clubMember.state,
	postalCode: clubMember.postalCode,
	country: clubMember.country,
	notes: clubMember.notes,
	guardianName: clubMember.guardianName,
	guardianEmail: clubMember.guardianEmail,
	guardianPhone: clubMember.guardianPhone,
	organizationId: clubMember.organizationId,
	createdAt: clubMember.createdAt,
	updatedAt: clubMember.updatedAt,
	contractId: contract.id,
	contractStartDate: contract.startDate,
	contractInitialPeriod: contract.initialPeriod,
	contractInitialPeriodEndDate: contract.initialPeriodEndDate,
	contractCurrentPeriodEndDate: contract.currentPeriodEndDate,
	contractNextBillingDate: contract.nextBillingDate,
	contractJoiningFeeAmount: contract.joiningFeeAmount,
	contractYearlyFeeAmount: contract.yearlyFeeAmount,
	contractNotes: contract.notes,
	contractCancelledAt: contract.cancelledAt,
	contractCancelReason: contract.cancelReason,
	contractCancellationEffectiveDate: contract.cancellationEffectiveDate,
};

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
		const fallbackYear = String(now.getFullYear()).padStart(4, "0");
		const fallbackMonth = String(now.getMonth() + 1).padStart(2, "0");
		const fallbackDay = String(now.getDate()).padStart(2, "0");
		return `${fallbackYear}-${fallbackMonth}-${fallbackDay}`;
	}

	return `${year}-${month}-${day}`;
}

function getFieldConfig(field: z.infer<typeof filterFieldSchema>) {
	switch (field) {
		case "fullName":
			return {
				compareExpr: sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
				textExpr: sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
			};
		case "initialPeriod":
			return {
				compareExpr: contract.initialPeriod,
				textExpr: contract.initialPeriod,
			};
		case "cancelReason":
			return {
				compareExpr: contract.cancelReason,
				textExpr: contract.cancelReason,
			};
		case "startDate":
			return {
				compareExpr: contract.startDate,
				textExpr: sql`CAST(${contract.startDate} AS TEXT)`,
			};
		case "cancellationEffectiveDate":
			return {
				compareExpr: contract.cancellationEffectiveDate,
				textExpr: sql`CAST(${contract.cancellationEffectiveDate} AS TEXT)`,
			};
		case "cancelledAt":
			return {
				compareExpr: contract.cancelledAt,
				textExpr: sql`CAST(${contract.cancelledAt} AS TEXT)`,
			};
		case "firstName":
			return {
				compareExpr: clubMember.firstName,
				textExpr: clubMember.firstName,
			};
		case "lastName":
			return {
				compareExpr: clubMember.lastName,
				textExpr: clubMember.lastName,
			};
		case "email":
			return {
				compareExpr: clubMember.email,
				textExpr: clubMember.email,
			};
		case "phone":
			return {
				compareExpr: clubMember.phone,
				textExpr: clubMember.phone,
			};
		case "street":
			return {
				compareExpr: clubMember.street,
				textExpr: clubMember.street,
			};
		case "city":
			return {
				compareExpr: clubMember.city,
				textExpr: clubMember.city,
			};
		case "state":
			return {
				compareExpr: clubMember.state,
				textExpr: clubMember.state,
			};
		case "postalCode":
			return {
				compareExpr: clubMember.postalCode,
				textExpr: clubMember.postalCode,
			};
		case "country":
			return {
				compareExpr: clubMember.country,
				textExpr: clubMember.country,
			};
		case "notes":
			return {
				compareExpr: clubMember.notes,
				textExpr: clubMember.notes,
			};
		case "guardianName":
			return {
				compareExpr: clubMember.guardianName,
				textExpr: clubMember.guardianName,
			};
		case "guardianEmail":
			return {
				compareExpr: clubMember.guardianEmail,
				textExpr: clubMember.guardianEmail,
			};
		case "guardianPhone":
			return {
				compareExpr: clubMember.guardianPhone,
				textExpr: clubMember.guardianPhone,
			};
	}
}

function buildAdvancedFilterCondition(
	filter: z.infer<typeof advancedFilterSchema>,
) {
	const { compareExpr, textExpr } = getFieldConfig(filter.field);

	switch (filter.operator) {
		case "isNull":
			return sql`${compareExpr} IS NULL OR NULLIF(BTRIM(${textExpr}), '') IS NULL`;
		case "isNotNull":
			return sql`${compareExpr} IS NOT NULL AND NULLIF(BTRIM(${textExpr}), '') IS NOT NULL`;
		case "in": {
			const valuesSql = sql.join(
				filter.value.map((value) => sql`${value}`),
				sql`, `,
			);
			return sql`${compareExpr} IN (${valuesSql})`;
		}
		case "contains":
			return ilike(textExpr, `%${filter.value}%`);
		case "startsWith":
			return ilike(textExpr, `${filter.value}%`);
		case "endsWith":
			return ilike(textExpr, `%${filter.value}`);
		case "eq":
			return sql`${compareExpr} = ${filter.value}`;
		case "neq":
			return sql`${compareExpr} <> ${filter.value}`;
		case "gte":
			return sql`${compareExpr} >= ${filter.value}`;
		case "lte":
			return sql`${compareExpr} <= ${filter.value}`;
	}
}

function resolveMembershipStatus(
	contractCancelledAt: Date | null,
	cancellationEffectiveDate: string | null,
	today: string,
): "active" | "cancelled" | "cancelled_but_active" {
	if (!contractCancelledAt) {
		return "active";
	}

	if (!cancellationEffectiveDate || cancellationEffectiveDate >= today) {
		return "cancelled_but_active";
	}

	return "cancelled";
}

type MembersQueryContext =
	| {
			emptyResult: true;
			todayInBerlin: string;
	  }
	| {
			emptyResult: false;
			todayInBerlin: string;
			memberWhere: ReturnType<typeof and>;
			sortExpression: unknown;
			sortDirection: "asc" | "desc";
	  };

function buildMembersQueryContext({
	organizationId,
	input,
}: {
	organizationId: string;
	input: ListMembersAdvancedExportInput;
}): MembersQueryContext {
	const includeActive = input.status?.includeActive ?? true;
	const includeCancelled = input.status?.includeCancelled ?? false;
	const includeCancelledButActive =
		input.status?.includeCancelledButActive ?? true;

	const todayInBerlin = getTodayInBerlinDateString();

	if (!includeActive && !includeCancelled && !includeCancelledButActive) {
		return {
			emptyResult: true,
			todayInBerlin,
		};
	}

	const rawSearch = input.search?.trim();
	const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

	const groupIds =
		input.groupIds
			?.map((groupId) => groupId.trim())
			.filter(Boolean)
			.filter((value, index, values) => values.indexOf(value) === index) ??
		undefined;

	if (input.groupIds && (!groupIds || groupIds.length === 0)) {
		return {
			emptyResult: true,
			todayInBerlin,
		};
	}

	const statusConditions = [
		includeActive ? sql`${contract.cancelledAt} IS NULL` : undefined,
		includeCancelledButActive
			? sql`${contract.cancelledAt} IS NOT NULL AND (
          ${contract.cancellationEffectiveDate} IS NULL
          OR ${contract.cancellationEffectiveDate} >= ${todayInBerlin}
        )`
			: undefined,
		includeCancelled
			? sql`${contract.cancelledAt} IS NOT NULL AND (
          ${contract.cancellationEffectiveDate} < ${todayInBerlin}
        )`
			: undefined,
	].filter(Boolean);

	const filterConditions = (input.filters ?? []).map((filter) =>
		buildAdvancedFilterCondition(filter),
	);

	const combinedFilterCondition =
		filterConditions.length === 0
			? undefined
			: (input.filterMode ?? "and") === "or"
				? or(...filterConditions)
				: and(...filterConditions);

	const searchCondition = search
		? or(
				ilike(clubMember.firstName, `%${search}%`),
				ilike(clubMember.lastName, `%${search}%`),
				ilike(clubMember.email, `%${search}%`),
				ilike(clubMember.phone, `%${search}%`),
				ilike(clubMember.street, `%${search}%`),
				ilike(clubMember.city, `%${search}%`),
				ilike(clubMember.state, `%${search}%`),
				ilike(clubMember.postalCode, `%${search}%`),
				ilike(clubMember.country, `%${search}%`),
				ilike(clubMember.notes, `%${search}%`),
				ilike(clubMember.guardianName, `%${search}%`),
				ilike(clubMember.guardianEmail, `%${search}%`),
				ilike(clubMember.guardianPhone, `%${search}%`),
				ilike(
					sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
					`%${search}%`,
				),
				ilike(contract.initialPeriod, `%${search}%`),
				ilike(contract.cancelReason, `%${search}%`),
				ilike(sql`CAST(${contract.startDate} AS TEXT)`, `%${search}%`),
				ilike(
					sql`CAST(${contract.cancellationEffectiveDate} AS TEXT)`,
					`%${search}%`,
				),
				ilike(sql`CAST(${contract.cancelledAt} AS TEXT)`, `%${search}%`),
			)
		: undefined;

	const memberWhere = and(
		eq(clubMember.organizationId, organizationId),
		searchCondition,
		groupIds?.length
			? sql`${clubMember.id} in (
          select ${groupMember.memberId}
          from ${groupMember}
          where ${inArray(groupMember.groupId, groupIds)}
        )`
			: undefined,
		statusConditions.length > 0 ? or(...statusConditions) : undefined,
		combinedFilterCondition,
	);

	const sortField = input.sort?.field ?? "createdAt";
	const sortDirection = input.sort?.direction ?? "desc";

	const sortExpression =
		sortField === "firstName"
			? clubMember.firstName
			: sortField === "lastName"
				? clubMember.lastName
				: sortField === "fullName"
					? sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`
					: sortField === "email"
						? clubMember.email
						: sortField === "city"
							? clubMember.city
							: sortField === "updatedAt"
								? clubMember.updatedAt
								: sortField === "startDate"
									? contract.startDate
									: sortField === "cancellationEffectiveDate"
										? contract.cancellationEffectiveDate
										: sortField === "cancelledAt"
											? contract.cancelledAt
											: clubMember.createdAt;

	return {
		emptyResult: false,
		todayInBerlin,
		memberWhere,
		sortExpression,
		sortDirection,
	};
}

async function buildGroupMap(memberIds: string[]) {
	if (memberIds.length === 0) {
		return new Map<
			string,
			{
				groupId: string;
				group: { id: string; name: string; color: string };
			}[]
		>();
	}

	const groupRows = await db
		.select({
			memberId: groupMember.memberId,
			groupId: groupMember.groupId,
			groupName: group.name,
			groupColor: group.color,
		})
		.from(groupMember)
		.innerJoin(group, eq(group.id, groupMember.groupId))
		.where(inArray(groupMember.memberId, memberIds));

	return groupRows.reduce(
		(acc, row) => {
			const groupMembers = acc.get(row.memberId) ?? [];
			groupMembers.push({
				groupId: row.groupId,
				group: { id: row.groupId, name: row.groupName, color: row.groupColor },
			});
			acc.set(row.memberId, groupMembers);
			return acc;
		},
		new Map<
			string,
			{
				groupId: string;
				group: { id: string; name: string; color: string };
			}[]
		>(),
	);
}

async function fetchMembersAdvancedData({
	organizationId,
	input,
	page,
	limit,
	maxRows,
}: {
	organizationId: string;
	input: ListMembersAdvancedExportInput;
	page?: number;
	limit?: number;
	maxRows?: number;
}) {
	const queryContext = buildMembersQueryContext({
		organizationId,
		input,
	});

	if (queryContext.emptyResult) {
		return {
			data: [],
			totalCount: 0,
			exceededMaxRows: false,
		};
	}

	const { memberWhere, sortExpression, sortDirection, todayInBerlin } =
		queryContext;

	const [{ count: totalCount = 0 } = { count: 0 }] = await db
		.select({ count: count() })
		.from(clubMember)
		.innerJoin(contract, eq(contract.memberId, clubMember.id))
		.where(memberWhere);

	if (maxRows !== undefined && totalCount > maxRows) {
		return {
			data: [],
			totalCount,
			exceededMaxRows: true,
		};
	}

	if (totalCount === 0) {
		return {
			data: [],
			totalCount: 0,
			exceededMaxRows: false,
		};
	}

	const members =
		typeof page === "number" && typeof limit === "number"
			? await db
					.select(memberSelect)
					.from(clubMember)
					.innerJoin(contract, eq(contract.memberId, clubMember.id))
					.where(memberWhere)
					.orderBy(
						sortDirection === "asc"
							? sql`${sortExpression} asc`
							: sql`${sortExpression} desc`,
					)
					.limit(limit)
					.offset((page - 1) * limit)
			: await db
					.select(memberSelect)
					.from(clubMember)
					.innerJoin(contract, eq(contract.memberId, clubMember.id))
					.where(memberWhere)
					.orderBy(
						sortDirection === "asc"
							? sql`${sortExpression} asc`
							: sql`${sortExpression} desc`,
					);

	const groupMap = await buildGroupMap(members.map((member) => member.id));

	const data = members.map((member) => {
		const {
			contractId,
			contractStartDate,
			contractInitialPeriod,
			contractInitialPeriodEndDate,
			contractCurrentPeriodEndDate,
			contractNextBillingDate,
			contractJoiningFeeAmount,
			contractYearlyFeeAmount,
			contractNotes,
			contractCancelledAt,
			contractCancelReason,
			contractCancellationEffectiveDate,
			...memberData
		} = member;

		return {
			...memberData,
			membershipStatus: resolveMembershipStatus(
				contractCancelledAt,
				contractCancellationEffectiveDate,
				todayInBerlin,
			),
			contract: {
				id: contractId,
				startDate: contractStartDate,
				initialPeriod: contractInitialPeriod,
				initialPeriodEndDate: contractInitialPeriodEndDate,
				currentPeriodEndDate: contractCurrentPeriodEndDate,
				nextBillingDate: contractNextBillingDate,
				joiningFeeAmount: contractJoiningFeeAmount,
				yearlyFeeAmount: contractYearlyFeeAmount,
				notes: contractNotes,
				cancelledAt: contractCancelledAt,
				cancelReason: contractCancelReason,
				cancellationEffectiveDate: contractCancellationEffectiveDate,
			},
			groupMembers: groupMap.get(member.id) ?? [],
		};
	});

	return {
		data,
		totalCount,
		exceededMaxRows: false,
	};
}

function toListMembersAdvancedExportInput(
	input: ListMembersAdvancedInput,
): ListMembersAdvancedExportInput {
	return {
		search: input.search,
		groupIds: input.groupIds,
		status: input.status,
		sort: input.sort,
		filterMode: input.filterMode,
		filters: input.filters,
	};
}

export async function listMembersAdvanced({
	organizationId,
	input,
}: {
	organizationId: string;
	input: ListMembersAdvancedInput;
}) {
	const page = input.page ?? 1;
	const limit = input.limit ?? 20;

	const { data, totalCount } = await fetchMembersAdvancedData({
		organizationId,
		input: toListMembersAdvancedExportInput(input),
		page,
		limit,
	});

	const totalPages = Math.ceil(totalCount / limit);

	return {
		data,
		pagination: {
			page,
			limit,
			totalCount,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
		},
	};
}

export async function listMembersAdvancedForExport({
	organizationId,
	input,
	maxRows,
}: {
	organizationId: string;
	input: ListMembersAdvancedExportInput;
	maxRows: number;
}) {
	return fetchMembersAdvancedData({
		organizationId,
		input,
		maxRows,
	});
}

export type ListMembersAdvancedRecord = Awaited<
	ReturnType<typeof listMembersAdvanced>
>["data"][number];

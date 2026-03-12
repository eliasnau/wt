import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, count, db, desc, eq, ilike, inArray, or, sql } from "@repo/db";
import { DB } from "@repo/db/functions";
import {
	clubMember,
	contract,
	group,
	groupMember,
	payment,
	paymentBatch,
} from "@repo/db/schema";
import { after } from "next/server";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { logger } from "../lib/logger";
import { getPostHogServer } from "../lib/posthog";
import { loadSepaModule } from "../lib/sepa";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";
import {
	listMembersAdvanced,
	listMembersAdvancedExportSchema,
	listMembersAdvancedForExport,
	listMembersAdvancedSchema,
} from "./members/listMembersAdvanced";
import {
	buildMembersExportFilename,
	serializeMembersCsv,
} from "./members/membersCsvExport";

const optionalEmailSchema = z
	.string()
	.trim()
	.email("Invalid email address")
	.or(z.string().trim().length(0));
const optionalPhoneSchema = z.string().trim().max(255, "Phone is too long");

const createMemberSchema = z.object({
	// Personal info
	firstName: z.string().min(1, "First name is required").max(255),
	lastName: z.string().min(1, "Last name is required").max(255),
	birthdate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)")
		.optional()
		.or(z.literal("")),
	email: optionalEmailSchema,
	phone: optionalPhoneSchema,

	// Address
	street: z.string().min(1, "Street is required"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),

	// Payment info
	iban: z.string().min(1, "IBAN is required"),
	bic: z.string().min(1, "BIC is required"),
	cardHolder: z.string().min(1, "Card holder name is required"),

	// Contract details
	contractStartDate: z
		.string()
		.regex(/^\d{4}-\d{2}-01$/, "Must be 1st day of month (YYYY-MM-01)"),
	initialPeriod: z.enum(["monthly", "half_yearly", "yearly"]),
	joiningFeeAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional(),
	yearlyFeeAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional(),

	// Optional notes
	memberNotes: z.string().max(1000).optional(),
	contractNotes: z.string().max(1000).optional(),

	// Optional guardian info
	guardianName: z.string().optional(),
	guardianEmail: z.string().email().optional().or(z.literal("")),
	guardianPhone: z.string().optional(),
});

const listMembersSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	groupIds: z.array(z.string()).optional(),
	options: z
		.object({
			includeCancelledMembers: z.boolean().optional(),
			memberStatus: z
				.enum(["active", "cancelled", "cancelled_but_active"])
				.optional(),
		})
		.optional(),
});

const getMemberSchema = z.object({
	memberId: z.string(),
});

const cancelContractSchema = z.object({
	memberId: z.string(),
	cancelReason: z.string().min(1, "Cancel reason is required").max(1000),
	cancellationEffectiveDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)"),
});

const updateMemberSchema = z.object({
	memberId: z.string(),
	// Personal info
	firstName: z.string().min(1, "First name is required").max(255),
	lastName: z.string().min(1, "Last name is required").max(255),
	birthdate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)")
		.optional()
		.or(z.literal("")),
	email: optionalEmailSchema,
	phone: optionalPhoneSchema,
	// Address
	street: z.string().min(1, "Street is required"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
	// Optional notes
	memberNotes: z.string().max(1000).optional(),
	// Optional guardian info
	guardianName: z.string().optional(),
	guardianEmail: z.string().email().optional().or(z.literal("")),
	guardianPhone: z.string().optional(),
	// Contract details
	initialPeriod: z.enum(["monthly", "half_yearly", "yearly"]),
	joiningFeeAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional()
		.or(z.literal("")),
	yearlyFeeAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional()
		.or(z.literal("")),
	contractNotes: z.string().max(1000).optional(),
});

const assignGroupSchema = z.object({
	memberId: z.string(),
	groupId: z.string(),
	membershipPrice: z.number().nonnegative().finite().optional(),
});

const updateGroupMembershipSchema = z.object({
	memberId: z.string(),
	groupId: z.string(),
	membershipPrice: z.number().nonnegative().finite().nullable(),
});

const removeGroupMembershipSchema = z.object({
	memberId: z.string(),
	groupId: z.string(),
});

const MAX_MEMBERS_EXPORT_ROWS = 10_000;

type DateParts = {
	year: number;
	month: number;
	day: number;
};

type SepaMemberValidationIssue = {
	memberId: string;
	memberName: string;
	reasons: string[];
};

function parseDateOnly(dateStr: string): DateParts | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (!year || month < 1 || month > 12) return null;

	const daysInMonth = new Date(year, month, 0).getDate();
	if (day < 1 || day > daysInMonth) return null;

	return { year, month, day };
}

function formatDateOnly(year: number, month: number, day: number): string {
	return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getLastDayOfMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
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
		return formatDateOnly(now.getFullYear(), now.getMonth() + 1, now.getDate());
	}

	return `${year}-${month}-${day}`;
}

function generateMandateId(): string {
	return `WT-${randomBytes(12).toString("hex").toUpperCase()}`;
}

function normalizeIban(value: string | null | undefined): string {
	return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

function normalizeBic(value: string | null | undefined): string {
	return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

function normalizeRequiredText(value: string | null | undefined): string {
	return (value ?? "").trim();
}

function normalizeOptionalText(value: string | null | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}

/**
 * Calculate the end date for the initial period based on contract type
 */
function calculateInitialPeriodEndDate(
	startDate: string,
	period: "monthly" | "half_yearly" | "yearly",
): string {
	const parsedStartDate = parseDateOnly(startDate);
	if (!parsedStartDate) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid contract start date",
		});
	}

	const periodMonths =
		period === "monthly" ? 1 : period === "half_yearly" ? 6 : 12;
	const endMonthIndex = parsedStartDate.month - 1 + periodMonths - 1;
	const endYear = parsedStartDate.year + Math.floor(endMonthIndex / 12);
	const endMonth = (endMonthIndex % 12) + 1;
	const endDay = getLastDayOfMonth(endYear, endMonth);
	return formatDateOnly(endYear, endMonth, endDay);
}

/**
 * Get the next billing date (first billing is same as start date)
 */
function getNextBillingDate(startDate: string): string {
	// First billing happens immediately on start date
	return startDate;
}

export const membersRouter = {
	get: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["view"] }))
		.input(getMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			try {
				const member = await DB.query.members.getMemberWithDetails({
					memberId: input.memberId,
				});

				if (!member) {
					throw new ORPCError("NOT_FOUND", {
						message: "Member not found",
					});
				}

				if (member.organizationId !== organizationId) {
					throw new ORPCError("NOT_FOUND", {
						message: "Member not found",
					});
				}

				return member;
			} catch (error) {
				if (error instanceof ORPCError) throw error;

				after(() => {
					logger.error("Failed to get group", {
						error,
						organizationId,
						memberId: input.memberId,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Internal Server Error",
				});
			}
		})
		.route({ method: "GET", path: "/members/:memberId" }),

	getPaymentDetails: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(requirePermission({ member: ["view_payment"] }))
		.input(getMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const member = await DB.query.members.getMembersPaymentInfo({
				id: input.memberId,
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
		})
		.route({ method: "GET", path: "/members/:memberId/payment-details" }),

	getPayments: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(requirePermission({ member: ["view_payment"] }))
		.input(getMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const member = await db.query.clubMember.findFirst({
				where: and(
					eq(clubMember.id, input.memberId),
					eq(clubMember.organizationId, organizationId),
				),
				columns: {
					id: true,
				},
			});

			if (!member) {
				throw new ORPCError("NOT_FOUND", {
					message: "Member not found",
				});
			}

			const payments = await db
				.select({
					id: payment.id,
					batchId: payment.batchId,
					batchNumber: paymentBatch.batchNumber,
					billingMonth: paymentBatch.billingMonth,
					membershipAmount: payment.membershipAmount,
					joiningFeeAmount: payment.joiningFeeAmount,
					yearlyFeeAmount: payment.yearlyFeeAmount,
					totalAmount: payment.totalAmount,
					billingPeriodStart: payment.billingPeriodStart,
					billingPeriodEnd: payment.billingPeriodEnd,
					dueDate: payment.dueDate,
					notes: payment.notes,
					createdAt: payment.createdAt,
				})
				.from(payment)
				.innerJoin(contract, eq(payment.contractId, contract.id))
				.innerJoin(paymentBatch, eq(payment.batchId, paymentBatch.id))
				.where(
					and(
						eq(contract.memberId, input.memberId),
						eq(contract.organizationId, organizationId),
						eq(paymentBatch.organizationId, organizationId),
					),
				)
				.orderBy(desc(payment.dueDate), desc(payment.createdAt));

			return {
				memberId: input.memberId,
				payments,
			};
		})
		.route({ method: "GET", path: "/members/:memberId/payments" }),

	list: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["list"] }))
		.input(listMembersSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const { page, limit } = input;
			const includeCancelled = input.options?.includeCancelledMembers ?? false;
			const memberStatus = input.options?.memberStatus;
			const todayInBerlin = getTodayInBerlinDateString();

			const rawSearch = input.search?.trim();
			const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

			const groupIds =
				input.groupIds
					?.map((g) => g.trim())
					.filter(Boolean)
					.filter((v, i, a) => a.indexOf(v) === i) ?? undefined;

			if (input.groupIds && (!groupIds || groupIds.length === 0)) {
				return {
					data: [],
					pagination: {
						page,
						limit,
						totalCount: 0,
						totalPages: 0,
						hasNextPage: false,
						hasPreviousPage: page > 1,
					},
				};
			}

			const offset = (page - 1) * limit;

			const statusFilterWhere =
				memberStatus === "active"
					? sql`${contract.cancelledAt} IS NULL`
					: memberStatus === "cancelled"
						? sql`${contract.cancelledAt} IS NOT NULL
                AND ${contract.cancellationEffectiveDate} IS NOT NULL
                AND ${contract.cancellationEffectiveDate} < ${todayInBerlin}`
						: memberStatus === "cancelled_but_active"
							? sql`${contract.cancelledAt} IS NOT NULL
                  AND (
                    ${contract.cancellationEffectiveDate} IS NULL
                    OR ${contract.cancellationEffectiveDate} >= ${todayInBerlin}
                  )`
							: includeCancelled
								? undefined
								: sql`(
                    ${contract.cancellationEffectiveDate} IS NULL
                    OR ${contract.cancellationEffectiveDate} >= ${todayInBerlin}
                  )`;

			const memberWhere = and(
				eq(clubMember.organizationId, organizationId),
				search
					? or(
							ilike(clubMember.firstName, `%${search}%`),
							ilike(clubMember.lastName, `%${search}%`),
							ilike(sql`CAST(${clubMember.birthdate} AS TEXT)`, `%${search}%`),
							ilike(clubMember.email, `%${search}%`),
							ilike(clubMember.phone, `%${search}%`),
							ilike(
								sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
								`%${search}%`,
							),
						)
					: undefined,
				groupIds?.length
					? sql`${clubMember.id} in (
              select ${groupMember.memberId}
              from ${groupMember}
              where ${inArray(groupMember.groupId, groupIds)}
            )`
					: undefined,
				statusFilterWhere,
			);

			const members = await db
				.select({
					id: clubMember.id,
					firstName: clubMember.firstName,
					lastName: clubMember.lastName,
					birthdate: clubMember.birthdate,
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
					// Contract information (flat fields)
					contractId: contract.id,
					contractStartDate: contract.startDate,
					contractInitialPeriod: contract.initialPeriod,
					contractInitialPeriodEndDate: contract.initialPeriodEndDate,
					contractJoiningFeeAmount: contract.joiningFeeAmount,
					contractYearlyFeeAmount: contract.yearlyFeeAmount,
					contractNotes: contract.notes,
					contractCancelledAt: contract.cancelledAt,
					contractCancellationEffectiveDate: contract.cancellationEffectiveDate,
				})
				.from(clubMember)
				.innerJoin(contract, eq(contract.memberId, clubMember.id))
				.where(memberWhere)
				.limit(limit)
				.offset(offset);

			const [{ count: totalCount = 0 } = { count: 0 }] = await db
				.select({ count: count() })
				.from(clubMember)
				.innerJoin(contract, eq(contract.memberId, clubMember.id))
				.where(memberWhere);

			const totalPages = Math.ceil(totalCount / limit);

			// Fetch group info for the listed members in one shot
			const memberIds = members.map((m) => m.id);
			let groupMap = new Map<
				string,
				{
					groupId: string;
					membershipPrice: number;
					group: { id: string; name: string; color: string };
				}[]
			>();
			if (memberIds.length > 0) {
				const gmRows = await db
					.select({
						memberId: groupMember.memberId,
						groupId: groupMember.groupId,
						membershipPrice: groupMember.membershipPrice,
						gId: group.id,
						gName: group.name,
						gColor: group.color,
					})
					.from(groupMember)
					.innerJoin(group, eq(group.id, groupMember.groupId))
					.where(inArray(groupMember.memberId, memberIds));

				groupMap = gmRows.reduce(
					(acc, r) => {
						const list = acc.get(r.memberId) ?? [];
						list.push({
							groupId: r.groupId,
							membershipPrice: r.membershipPrice,
							group: { id: r.gId, name: r.gName, color: r.gColor },
						});
						acc.set(r.memberId, list);
						return acc;
					},
					new Map<
						string,
						{
							groupId: string;
							membershipPrice: number;
							group: { id: string; name: string; color: string };
						}[]
					>(),
				);
			}

			const data = members.map((m) => {
				const {
					contractId,
					contractStartDate,
					contractInitialPeriod,
					contractInitialPeriodEndDate,
					contractJoiningFeeAmount,
					contractYearlyFeeAmount,
					contractNotes,
					contractCancelledAt,
					contractCancellationEffectiveDate,
					...memberData
				} = m;

				return {
					...memberData,
					contract: {
						id: contractId,
						startDate: contractStartDate,
						initialPeriod: contractInitialPeriod,
						initialPeriodEndDate: contractInitialPeriodEndDate,
						joiningFeeAmount: contractJoiningFeeAmount,
						yearlyFeeAmount: contractYearlyFeeAmount,
						notes: contractNotes,
						cancelledAt: contractCancelledAt,
						cancellationEffectiveDate: contractCancellationEffectiveDate,
					},
					groupMembers: groupMap.get(m.id) ?? [],
				};
			});

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
		})
		.route({ method: "GET", path: "/members" }),

	query: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["view"] }))
		.input(listMembersAdvancedSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			return listMembersAdvanced({
				organizationId,
				input,
			});
		})
		.route({ method: "POST", path: "/members/query" }),

	validateSepa: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(requirePermission({ member: ["view"] }))
		.handler(async ({ context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const sepa = await loadSepaModule();
			const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;

			const rows = await db
				.select({
					memberId: clubMember.id,
					firstName: clubMember.firstName,
					lastName: clubMember.lastName,
					email: clubMember.email,
					iban: clubMember.iban,
					bic: clubMember.bic,
					cardHolder: clubMember.cardHolder,
					mandateId: contract.mandateId,
					mandateSignatureDate: contract.mandateSignatureDate,
					contractCancelledAt: contract.cancelledAt,
				})
				.from(clubMember)
				.innerJoin(contract, eq(contract.memberId, clubMember.id))
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
				if (!row.mandateSignatureDate)
					reasons.push("missing mandate signature date");

				return {
					memberId: row.memberId,
					memberName,
					email: row.email,
					contractCancelledAt: row.contractCancelledAt,
					valid: reasons.length === 0,
					reasons,
				};
			});

			const invalidMembers: SepaMemberValidationIssue[] = members
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
		})
		.route({ method: "GET", path: "/members/sepa/validate" }),

	exportCsv: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["export"] }))
		.input(listMembersAdvancedExportSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const result = await listMembersAdvancedForExport({
				organizationId,
				input,
				maxRows: MAX_MEMBERS_EXPORT_ROWS,
			});

			if (result.exceededMaxRows) {
				throw new ORPCError("BAD_REQUEST", {
					message: `CSV export is limited to ${MAX_MEMBERS_EXPORT_ROWS.toLocaleString("en-US")} rows. Please narrow your filters.`,
				});
			}

			return {
				filename: buildMembersExportFilename(),
				csv: serializeMembersCsv(result.data),
				rowCount: result.data.length,
			};
		})
		.route({ method: "POST", path: "/members/query/export" }),

	create: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ member: ["create"] }))
		.input(createMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const posthog = getPostHogServer();

			const sepa = await loadSepaModule();
			if (!sepa.validateIBAN(input.iban)) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Invalid IBAN",
				});
			}

			const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
			if (!bicRegex.test(input.bic)) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Invalid BIC",
				});
			}

			// Calculate contract dates
			const initialPeriodEndDate = calculateInitialPeriodEndDate(
				input.contractStartDate,
				input.initialPeriod,
			);
			const nextBillingDate = getNextBillingDate(input.contractStartDate);
			const mandateSignatureDate = getTodayInBerlinDateString();
			try {
				const result = await DB.mutation.members.createMemberWithContract({
					organizationId,
					memberId: randomBytes(16).toString("hex"),
					memberData: {
						firstName: input.firstName,
						lastName: input.lastName,
						email: normalizeOptionalText(input.email) ?? null,
						phone: normalizeOptionalText(input.phone) ?? null,
						birthdate: input.birthdate?.trim() || undefined,
						street: input.street,
						city: input.city,
						state: input.state,
						postalCode: input.postalCode,
						country: input.country,
						iban: input.iban,
						bic: input.bic,
						cardHolder: input.cardHolder,
						notes: input.memberNotes,
						guardianName: input.guardianName,
						guardianEmail: input.guardianEmail || undefined,
						guardianPhone: input.guardianPhone,
					},
					contractData: {
						initialPeriod: input.initialPeriod,
						startDate: input.contractStartDate,
						initialPeriodEndDate,
						nextBillingDate,
						mandateId: generateMandateId(),
						mandateSignatureDate,
						joiningFeeAmount: input.joiningFeeAmount,
						yearlyFeeAmount: input.yearlyFeeAmount,
						notes: input.contractNotes,
					},
				});

				posthog.capture({
					distinctId: context.userId,
					event: "members:create",
					groups: {
						organization: organizationId,
					},
					properties: {
						member_id: result.member.id,
					},
				});

				after(() => posthog.shutdown());

				return result;
			} catch (error) {
				posthog.captureException(error, context.userId, {
					context: "members:create",
					groups: {
						organization: organizationId,
					},
					input_email: input.email,
					trace_id: context.wideEvent.trace_id,
					request_id: context.wideEvent.request_id,
				});

				after(() => {
					posthog.shutdown();
					logger.error("Failed to create member", {
						error,
						organizationId,
						email: input.email,
						firstName: input.firstName,
						lastName: input.lastName,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create member",
				});
			}
		})
		.route({ method: "POST", path: "/members" }),

	update: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ member: ["update"] }))
		.input(updateMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const posthog = getPostHogServer();

			try {
				const result = await DB.mutation.members.updateMember({
					memberId: input.memberId,
					organizationId,
					memberData: {
						firstName: input.firstName,
						lastName: input.lastName,
						email: normalizeOptionalText(input.email) ?? null,
						phone: normalizeOptionalText(input.phone) ?? null,
						birthdate: input.birthdate?.trim() || undefined,
						street: input.street,
						city: input.city,
						state: input.state,
						postalCode: input.postalCode,
						country: input.country,
						notes: input.memberNotes,
						guardianName: input.guardianName,
						guardianEmail: input.guardianEmail || undefined,
						guardianPhone: input.guardianPhone,
					},
					contractData: {
						// initialPeriod: input.initialPeriod,
						joiningFeeAmount: input.joiningFeeAmount?.trim() || undefined,
						yearlyFeeAmount: input.yearlyFeeAmount?.trim() || undefined,
						notes: input.contractNotes,
					},
				});

				posthog.capture({
					distinctId: context.userId,
					event: "members:update",
					groups: {
						organization: organizationId,
					},
					properties: {
						member_id: result.member.id,
					},
				});

				after(() => posthog.shutdown());

				return result;
			} catch (error) {
				if (error instanceof ORPCError) throw error;

				posthog.captureException(error, context.userId, {
					context: "members:update",
					groups: {
						organization: organizationId,
					},
					member_id: input.memberId,
					trace_id: context.wideEvent.trace_id,
					request_id: context.wideEvent.request_id,
				});

				after(() => {
					posthog.shutdown();
					logger.error("Failed to update member", {
						error,
						organizationId,
						memberId: input.memberId,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update member",
				});
			}
		})
		.route({ method: "PATCH", path: "/members/:memberId" }),

	cancelContract: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ member: ["update"] }))
		.input(cancelContractSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const posthog = getPostHogServer();

			const effectiveDateParts = parseDateOnly(input.cancellationEffectiveDate);
			if (!effectiveDateParts) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Invalid cancellation effective date",
				});
			}

			const isLastDayOfMonth =
				effectiveDateParts.day ===
				getLastDayOfMonth(effectiveDateParts.year, effectiveDateParts.month);
			if (!isLastDayOfMonth) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"Cancellation effective date must be the last day of the month",
				});
			}

			const todayInBerlin = getTodayInBerlinDateString();
			if (input.cancellationEffectiveDate <= todayInBerlin) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Cancellation effective date must be in the future",
				});
			}

			try {
				const [existingContract] = await db
					.select()
					.from(contract)
					.where(
						and(
							eq(contract.memberId, input.memberId),
							eq(contract.organizationId, organizationId),
						),
					)
					.limit(1);

				if (!existingContract) {
					throw new ORPCError("NOT_FOUND", {
						message: "Contract not found for this member",
					});
				}

				if (existingContract.cancelledAt) {
					throw new ORPCError("BAD_REQUEST", {
						message: "Contract is already cancelled",
					});
				}

				if (existingContract.initialPeriodEndDate) {
					if (
						input.cancellationEffectiveDate <
						existingContract.initialPeriodEndDate
					) {
						throw new ORPCError("BAD_REQUEST", {
							message: `Initial period ends on ${existingContract.initialPeriodEndDate}. Cancellation effective date must be on or after that date.`,
						});
					}
				}

				const [updatedContract] = await db
					.update(contract)
					.set({
						cancelledAt: new Date(),
						cancelReason: input.cancelReason,
						cancellationEffectiveDate: input.cancellationEffectiveDate,
					})
					.where(eq(contract.id, existingContract.id))
					.returning();

				posthog.capture({
					distinctId: context.userId,
					event: "members:cancel-contract",
					groups: {
						organization: organizationId,
					},
					properties: {
						member_id: input.memberId,
						cancellation_effective_date: input.cancellationEffectiveDate,
					},
				});

				after(() => posthog.shutdown());

				return updatedContract;
			} catch (error) {
				if (error instanceof ORPCError) throw error;

				posthog.captureException(error, context.userId, {
					context: "members:cancel-contract",
					groups: {
						organization: organizationId,
					},
					member_id: input.memberId,
					trace_id: context.wideEvent.trace_id,
					request_id: context.wideEvent.request_id,
				});

				after(() => {
					posthog.shutdown();
					logger.error("Failed to cancel contract", {
						error,
						organizationId,
						memberId: input.memberId,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to cancel contract",
				});
			}
		})
		.route({ method: "POST", path: "/members/:memberId/cancel-contract" }),

	assignGroup: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(requirePermission({ member: ["update"] }))
		.input(assignGroupSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			// Validate member belongs to org
			const member = await DB.query.members.getMemberById({
				id: input.memberId,
			});
			if (!member || member.organizationId !== organizationId) {
				throw new ORPCError("NOT_FOUND", { message: "Member not found" });
			}

			// Validate group belongs to org
			const group = await DB.query.groups.getGroupById({
				groupId: input.groupId,
			});
			if (!group || group.organizationId !== organizationId) {
				throw new ORPCError("NOT_FOUND", { message: "Group not found" });
			}

			const posthog = getPostHogServer();

			try {
				const result = await DB.mutation.groups.assignMemberToGroup({
					memberId: input.memberId,
					groupId: input.groupId,
					membershipPrice: input.membershipPrice,
				});

				posthog.capture({
					distinctId: context.userId,
					event: "member:assign-group",
					groups: {
						organization: organizationId,
					},
					properties: {
						member_id: input.memberId,
						group_id: input.groupId,
						group_name: group.name,
						membership_price: result.membershipPrice,
					},
				});

				after(() => posthog.shutdown());

				return result;
			} catch (error) {
				// Check for duplicate key error (Postgres code 23505)
				if ((error as any).code === "23505") {
					after(() => posthog.shutdown());
					throw new ORPCError("BAD_REQUEST", {
						message: "Member is already in this group",
					});
				}

				posthog.captureException(error, context.userId, {
					context: "member:assign-group",
					groups: {
						organization: organizationId,
					},
					member_id: input.memberId,
					group_id: input.groupId,
					trace_id: context.wideEvent.trace_id,
					request_id: context.wideEvent.request_id,
				});

				after(() => {
					posthog.shutdown();
					logger.error("Failed to assign group", {
						error,
						organizationId,
						memberId: input.memberId,
						groupId: input.groupId,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to assign group",
				});
			}
		})
		.route({ method: "POST", path: "/members/:memberId/groups" }),

	updateGroupMembership: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(requirePermission({ member: ["update"] }))
		.input(updateGroupMembershipSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const posthog = getPostHogServer();

			const [member, group] = await Promise.all([
				DB.query.members.getMemberById({
					id: input.memberId,
				}),
				DB.query.groups.getGroupById({
					groupId: input.groupId,
				}),
			]);

			if (!member || member.organizationId !== organizationId) {
				throw new ORPCError("NOT_FOUND", { message: "Member not found" });
			}
			if (!group || group.organizationId !== organizationId) {
				throw new ORPCError("NOT_FOUND", { message: "Group not found" });
			}

			try {
				const result = await DB.mutation.groups.updateGroupMember({
					memberId: input.memberId,
					groupId: input.groupId,
					membershipPrice: input.membershipPrice ?? null,
				});

				if (!result) {
					throw new ORPCError("NOT_FOUND", {
						message: "Membership not found",
					});
				}

				posthog.capture({
					distinctId: context.userId,
					event: "member:update-group",
					groups: {
						organization: organizationId,
					},
					properties: {
						member_id: input.memberId,
						group_id: input.groupId,
						group_name: group.name,
						membership_price: result.membershipPrice,
					},
				});

				after(() => posthog.shutdown());

				return result;
			} catch (error) {
				if (error instanceof ORPCError) throw error;

				posthog.captureException(error, context.userId, {
					context: "member:update-group",
					groups: {
						organization: organizationId,
					},
					member_id: input.memberId,
					group_id: input.groupId,
					trace_id: context.wideEvent.trace_id,
					request_id: context.wideEvent.request_id,
				});

				after(() => {
					posthog.shutdown();
					logger.error("Failed to update group membership", {
						error,
						organizationId,
						memberId: input.memberId,
						groupId: input.groupId,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update group membership",
				});
			}
		})
		.route({ method: "PATCH", path: "/members/:memberId/groups/:groupId" }),

	removeGroupMembership: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(requirePermission({ member: ["update"] }))
		.input(removeGroupMembershipSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			const [member, group] = await Promise.all([
				DB.query.members.getMemberById({ id: input.memberId }),
				DB.query.groups.getGroupById({ groupId: input.groupId }),
			]);

			if (!member || member.organizationId !== organizationId) {
				throw new ORPCError("NOT_FOUND", { message: "Member not found" });
			}

			if (!group || group.organizationId !== organizationId) {
				throw new ORPCError("NOT_FOUND", { message: "Group not found" });
			}

			const posthog = getPostHogServer();

			try {
				const result = await DB.mutation.groups.removeMemberFromGroup({
					memberId: input.memberId,
					groupId: input.groupId,
				});

				if (!result) {
					throw new ORPCError("NOT_FOUND", {
						message: "Membership not found",
					});
				}

				posthog.capture({
					distinctId: context.userId,
					event: "member:remove-group",
					groups: {
						organization: organizationId,
					},
					properties: {
						member_id: input.memberId,
						group_id: input.groupId,
						group_name: group.name,
					},
				});

				after(() => posthog.shutdown());

				return result;
			} catch (error) {
				if (error instanceof ORPCError) {
					after(() => posthog.shutdown());
					throw error;
				}

				posthog.captureException(error, context.userId, {
					context: "member:remove-group",
					groups: {
						organization: organizationId,
					},
					member_id: input.memberId,
					group_id: input.groupId,
					trace_id: context.wideEvent.trace_id,
					request_id: context.wideEvent.request_id,
				});

				after(() => {
					posthog.shutdown();
					logger.error("Failed to remove member from group", {
						error,
						organizationId,
						memberId: input.memberId,
						groupId: input.groupId,
						userId: context.user.id,
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to remove member from group",
				});
			}
		})
		.route({ method: "DELETE", path: "/members/:memberId/groups/:groupId" }),
};

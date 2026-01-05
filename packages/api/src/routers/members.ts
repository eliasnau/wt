import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, count, db, eq, ilike, inArray, or, sql } from "@repo/db";
import { clubMember, contract, group, groupMember } from "@repo/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";
import { DB } from "@repo/db/functions";
import { logger } from "../lib/logger";
import { after } from "next/server";

const createMemberSchema = z.object({
	// Personal info
	firstName: z.string().min(1, "First name is required").max(255),
	lastName: z.string().min(1, "Last name is required").max(255),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(1, "Phone is required"),

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
});

const listMembersSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	groupIds: z.array(z.string().uuid()).optional(),
});

const getMemberSchema = z.object({
	memberId: z.string(),
});

const cancelContractSchema = z.object({
	memberId: z.string().uuid(),
	cancelReason: z.string().min(1, "Cancel reason is required").max(1000),
	cancellationEffectiveDate: z
		.string()
		.regex(/^\d{4}-\d{2}-01$/, "Must be 1st day of month (YYYY-MM-01)"),
});

/**
 * Calculate the end date for the initial period based on contract type
 */
function calculateInitialPeriodEndDate(
	startDate: string,
	period: "monthly" | "half_yearly" | "yearly",
): string {
	const date = new Date(startDate);

	switch (period) {
		case "monthly":
			// 1 month from start
			date.setMonth(date.getMonth() + 1);
			break;
		case "half_yearly":
			// 6 months from start
			date.setMonth(date.getMonth() + 6);
			break;
		case "yearly":
			// 12 months from start
			date.setMonth(date.getMonth() + 12);
			break;
	}

	// Subtract 1 day to get last day of period
	date.setDate(date.getDate() - 1);

	return date.toISOString().split("T")[0]!;
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

	list: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["list"] }))
		.input(listMembersSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const { page, limit } = input;

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

			const memberWhere = and(
				eq(clubMember.organizationId, organizationId),
				search
					? or(
							ilike(clubMember.firstName, `%${search}%`),
							ilike(clubMember.lastName, `%${search}%`),
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
				// Only show members who haven't been cancelled OR are still in their paid period
				sql`EXISTS (
				SELECT 1 FROM ${contract}
				WHERE ${contract.memberId} = ${clubMember.id}
				AND (
					${contract.cancellationEffectiveDate} IS NULL
					OR ${contract.cancellationEffectiveDate} >= CURRENT_DATE
				)
			)`,
			);

			const members = await db
				.select({
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
					organizationId: clubMember.organizationId,
					createdAt: clubMember.createdAt,
					updatedAt: clubMember.updatedAt,
					// Contract information (flat fields)
					contractId: contract.id,
					contractStartDate: contract.startDate,
					contractInitialPeriod: contract.initialPeriod,
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
				{ groupId: string; group: { id: string; name: string } }[]
			>();
			if (memberIds.length > 0) {
				const gmRows = await db
					.select({
						memberId: groupMember.memberId,
						groupId: groupMember.groupId,
						gId: group.id,
						gName: group.name,
					})
					.from(groupMember)
					.innerJoin(group, eq(group.id, groupMember.groupId))
					.where(inArray(groupMember.memberId, memberIds));

				groupMap = gmRows.reduce(
					(acc, r) => {
						const list = acc.get(r.memberId) ?? [];
						list.push({
							groupId: r.groupId,
							group: { id: r.gId, name: r.gName },
						});
						acc.set(r.memberId, list);
						return acc;
					},
					new Map<
						string,
						{
							groupId: string;
							group: { id: string; name: string };
						}[]
					>(),
				);
			}

			const data = members.map((m) => {
				const {
					contractId,
					contractStartDate,
					contractInitialPeriod,
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

	create: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ member: ["create"] }))
		.input(createMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			// Validate that contractStartDate is 1st of month
			const startDate = new Date(input.contractStartDate);
			if (startDate.getDate() !== 1) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Contract start date must be the 1st of the month",
				});
			}

			// Calculate contract dates
			const initialPeriodEndDate = calculateInitialPeriodEndDate(
				input.contractStartDate,
				input.initialPeriod,
			);
			const nextBillingDate = getNextBillingDate(input.contractStartDate);

			const dbStartTime = Date.now();
			try {
				const result = await DB.mutation.members.createMemberWithContract({
					organizationId,
					memberId: randomBytes(16).toString("hex"),
					memberData: {
						firstName: input.firstName,
						lastName: input.lastName,
						email: input.email,
						phone: input.phone,
						street: input.street,
						city: input.city,
						state: input.state,
						postalCode: input.postalCode,
						country: input.country,
						iban: input.iban,
						bic: input.bic,
						cardHolder: input.cardHolder,
						notes: input.memberNotes,
					},
					contractData: {
						initialPeriod: input.initialPeriod,
						startDate: input.contractStartDate,
						initialPeriodEndDate,
						nextBillingDate,
						joiningFeeAmount: input.joiningFeeAmount,
						yearlyFeeAmount: input.yearlyFeeAmount,
						notes: input.contractNotes,
					},
				});

				// Add success details to wide event
				if (context.wideEvent) {
					context.wideEvent.member_id = result.member.id;
					context.wideEvent.contract_id = result.contract.id;
					context.wideEvent.member_created = true;
					context.wideEvent.db_latency_ms = Date.now() - dbStartTime;
				}

				return result;
			} catch (error) {
				// Add error details to wide event
				if (context.wideEvent && !(error instanceof ORPCError)) {
					context.wideEvent.db_error = true;
					context.wideEvent.error_during = "member_creation";
					context.wideEvent.db_latency_ms = Date.now() - dbStartTime;
				}

				after(() => {
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

	cancelContract: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ member: ["update"] }))
		.input(cancelContractSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			const effectiveDate = new Date(input.cancellationEffectiveDate);
			if (effectiveDate.getDate() !== 1) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Cancellation effective date must be the 1st of the month",
				});
			}

			const today = new Date();
			today.setHours(0, 0, 0, 0);
			if (effectiveDate <= today) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Cancellation effective date must be in the future",
				});
			}

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

			const [updatedContract] = await db
				.update(contract)
				.set({
					cancelledAt: new Date(),
					cancelReason: input.cancelReason,
					cancellationEffectiveDate: input.cancellationEffectiveDate,
				})
				.where(eq(contract.id, existingContract.id))
				.returning();

			return updatedContract;
		})
		.route({ method: "POST", path: "/members/:memberId/cancel-contract" }),
};

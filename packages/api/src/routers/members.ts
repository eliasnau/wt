import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, count, db, eq, ilike, inArray, or, sql } from "@repo/db";
import { DB } from "@repo/db/functions";
import { clubMember, contract, group, groupMember } from "@repo/db/schema";
import { after } from "next/server";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { logger } from "../lib/logger";
import { loadSepaModule } from "../lib/sepa";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";

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

	// Optional guardian info
	guardianName: z.string().optional(),
	guardianEmail: z.string().email().optional().or(z.literal("")),
	guardianPhone: z.string().optional(),
});

const listMembersSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	groupIds: z.array(z.string().uuid()).optional(),
	includeCancelled: z.boolean().optional(),
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

const updateMemberSchema = z.object({
	memberId: z.string(),
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
	// Optional notes
	memberNotes: z.string().max(1000).optional(),
	// Optional guardian info
	guardianName: z.string().optional(),
	guardianEmail: z.string().email().optional().or(z.literal("")),
	guardianPhone: z.string().optional(),
	// Contract details
	contractStartDate: z
		.string()
		.regex(/^\d{4}-\d{2}-01$/, "Must be 1st day of month (YYYY-MM-01)"),
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
	membershipPrice: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional(),
});

const updateGroupMembershipSchema = z.object({
	memberId: z.string(),
	groupId: z.string(),
	membershipPrice: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.nullable(),
});

const removeGroupMembershipSchema = z.object({
	memberId: z.string(),
	groupId: z.string(),
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

	list: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["list"] }))
		.input(listMembersSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const { page, limit } = input;
			const includeCancelled = input.includeCancelled ?? false;

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
				includeCancelled
					? undefined
					: sql`EXISTS (
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
						guardianName: input.guardianName,
						guardianEmail: input.guardianEmail || undefined,
						guardianPhone: input.guardianPhone,
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

				return result;
			} catch (error) {
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

	update: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ member: ["update"] }))
		.input(updateMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			// Validate that contractStartDate is 1st of month
			const startDate = new Date(input.contractStartDate);
			if (startDate.getDate() !== 1) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Contract start date must be the 1st of the month",
				});
			}

			try {
				const result = await DB.mutation.members.updateMember({
					memberId: input.memberId,
					organizationId,
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
						notes: input.memberNotes,
						guardianName: input.guardianName,
						guardianEmail: input.guardianEmail || undefined,
						guardianPhone: input.guardianPhone,
					},
					contractData: {
						// initialPeriod: input.initialPeriod,
						startDate: input.contractStartDate,
						joiningFeeAmount: input.joiningFeeAmount?.trim() || undefined,
						yearlyFeeAmount: input.yearlyFeeAmount?.trim() || undefined,
						notes: input.contractNotes,
					},
				});

				return result;
			} catch (error) {
				if (error instanceof ORPCError) throw error;

				after(() => {
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

			const effectiveDate = new Date(input.cancellationEffectiveDate);
			effectiveDate.setHours(0, 0, 0, 0);
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

			if (existingContract.initialPeriodEndDate) {
				const initialEndDate = new Date(existingContract.initialPeriodEndDate);
				initialEndDate.setHours(0, 0, 0, 0);

				if (!Number.isNaN(initialEndDate.getTime())) {
					const earliestEffectiveDate = new Date(
						initialEndDate.getFullYear(),
						initialEndDate.getMonth() + 1,
						1,
					);
					earliestEffectiveDate.setHours(0, 0, 0, 0);

					if (effectiveDate < earliestEffectiveDate) {
						const formattedInitialEnd = initialEndDate
							.toISOString()
							.split("T")[0]!;
						const formattedEarliest = earliestEffectiveDate
							.toISOString()
							.split("T")[0]!;

						throw new ORPCError("BAD_REQUEST", {
							message: `Initial period ends on ${formattedInitialEnd}. Cancellation effective date must be on or after ${formattedEarliest}.`,
						});
					}
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

			return updatedContract;
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

			try {
				const result = await DB.mutation.groups.assignMemberToGroup({
					memberId: input.memberId,
					groupId: input.groupId,
					membershipPrice: input.membershipPrice,
				});
				return result;
			} catch (error) {
				// Check for duplicate key error (Postgres code 23505)
				if ((error as any).code === "23505") {
					throw new ORPCError("BAD_REQUEST", {
						message: "Member is already in this group",
					});
				}

				after(() => {
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

				return result;
			} catch (error) {
				if (error instanceof ORPCError) throw error;

				after(() => {
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

				return result;
			} catch (error) {
				if (error instanceof ORPCError) throw error;

				after(() => {
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

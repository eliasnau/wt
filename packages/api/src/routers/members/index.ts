import { ORPCError } from "@orpc/server";
import { syncAutumnUsage } from "@repo/autumn/backend";
import { and, count, db, eq, sql } from "@repo/db";
import { clubMember, contract } from "@repo/db/schema";
import { after } from "next/server";
import { protectedProcedure } from "../../index";
import { logger } from "../../lib/logger";
import { getPostHogServer } from "../../lib/posthog";
import { requirePermission } from "../../middleware/permissions";
import { rateLimitMiddleware } from "../../middleware/ratelimit";
import {
	listMembersAdvanced,
	listMembersAdvancedExportSchema,
	listMembersAdvancedForExport,
	listMembersAdvancedSchema,
} from "./listMembersAdvanced";
import { getMemberById, getMemberSchema } from "./getMember";
import { getMemberPaymentDetails } from "./getPaymentDetails";
import { getMemberPayments } from "./getPayments";
import { listMembers, listMembersSchema } from "./listMembers";
import {
	buildMembersExportFilename,
	serializeMembersCsv,
} from "./membersCsvExport";
import { reGeocodeOrganizationProcedure } from "./reGeocodeOrganization";
import { validateSepaMembers } from "./validateSepa";
import { createMemberSchema, createMemberWithContract } from "./createMember";
import {
	cancelContractSchema,
	cancelMemberContract,
} from "./cancelContract";
import {
	assignGroupSchema,
	assignMemberToGroup,
	removeGroupMembershipSchema,
	removeMemberGroupMembership,
	updateGroupMembershipSchema,
	updateMemberGroupMembership,
} from "./groupMembership";
import {
	updateBillingInfoSchema,
	createMandateForBillingInfo,
} from "./updateBillingInfo";
import {
	updateMemberContractSchema,
	updateCurrentMemberContract,
} from "./updateMemberContract";
import {
	updateMemberDetailsSchema,
	updateMemberDetails,
} from "./updateMemberDetails";
import { searchMembers, searchMembersSchema } from "./searchMembers";

const MAX_MEMBERS_EXPORT_ROWS = 10_000;

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

async function syncOrganizationMembersUsage(organizationId: string) {
	const todayInBerlin = getTodayInBerlinDateString();
	const [{ count: memberCount = 0 } = { count: 0 }] = await db
		.select({ count: count() })
		.from(clubMember)
		.innerJoin(contract, eq(contract.memberId, clubMember.id))
		.where(
			and(
				eq(clubMember.organizationId, organizationId),
				sql`(
					${contract.cancellationEffectiveDate} IS NULL
					OR ${contract.cancellationEffectiveDate} >= ${todayInBerlin}
				)`,
			),
		);

	await syncAutumnUsage({
		customerId: organizationId,
		featureId: "members",
		value: memberCount,
	});
}

export const membersRouter = {
	get: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["view"] }))
		.input(getMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			try {
				return getMemberById({
					organizationId,
					memberId: input.memberId,
				});
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
			return getMemberPaymentDetails({
				organizationId,
				memberId: input.memberId,
			});
		})
		.route({ method: "GET", path: "/members/:memberId/payment-details" }),

	getPayments: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(requirePermission({ member: ["view_payment"] }))
		.input(getMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			return getMemberPayments({
				organizationId,
				memberId: input.memberId,
			});
		})
		.route({ method: "GET", path: "/members/:memberId/payments" }),

	list: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["list"] }))
		.input(listMembersSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			return listMembers({
				organizationId,
				input,
			});
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

	search: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["view"] }))
		.input(searchMembersSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			return searchMembers({
				organizationId,
				input,
			});
		})
		.route({ method: "POST", path: "/members/search" }),

	validateSepa: protectedProcedure
		.use(rateLimitMiddleware(2))
		.use(requirePermission({ member: ["view"] }))
		.handler(async ({ context }) => {
			const organizationId = context.session.activeOrganizationId!;
			return validateSepaMembers({
				organizationId,
			});
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

	printList: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ member: ["view"] }))
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
					message: `Printing is limited to ${MAX_MEMBERS_EXPORT_ROWS.toLocaleString("en-US")} rows. Please narrow your filters.`,
				});
			}

			return {
				rowCount: result.data.length,
				members: result.data,
			};
		})
		.route({ method: "POST", path: "/members/query/print" }),

	create: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ member: ["create"] }))
		.input(createMemberSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const posthog = getPostHogServer();
			try {
				const result = await createMemberWithContract({
					organizationId,
					input,
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

				await syncOrganizationMembersUsage(organizationId);

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

	reGeocodeOrganization: reGeocodeOrganizationProcedure,

	updateMemberDetails: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ member: ["update"] }))
		.input(updateMemberDetailsSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			return updateMemberDetails({
				organizationId,
				memberId: input.memberId,
				firstName: input.firstName,
				lastName: input.lastName,
				birthdate: input.birthdate,
				email: input.email,
				phone: input.phone,
				street: input.street,
				city: input.city,
				state: input.state,
				postalCode: input.postalCode,
				country: input.country,
			});
		})
		.route({ method: "PATCH", path: "/members/:memberId/details" }),

	updateMemberContract: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ member: ["update"] }))
		.input(updateMemberContractSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			return updateCurrentMemberContract({
				organizationId,
				memberId: input.memberId,
				joiningFeeCents: input.joiningFeeCents,
				yearlyFeeCents: input.yearlyFeeCents,
			});
		})
		.route({ method: "PATCH", path: "/members/:memberId/contract" }),

	updateBillingInfo: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ sepa: ["update"] }))
		.input(updateBillingInfoSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			return createMandateForBillingInfo({
				organizationId,
				memberId: input.memberId,
				accountHolder: input.accountHolder,
				iban: input.iban,
				bic: input.bic,
			});
		})
		.route({ method: "POST", path: "/members/:memberId/billing-info" }),

	cancelContract: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ member: ["update"] }))
		.input(cancelContractSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const posthog = getPostHogServer();

			try {
				const updatedContract = await cancelMemberContract({
					organizationId,
					memberId: input.memberId,
					cancelReason: input.cancelReason,
					cancellationEffectiveDate: input.cancellationEffectiveDate,
				});

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
			const posthog = getPostHogServer();

			try {
				const { result, group } = await assignMemberToGroup({
					organizationId,
					memberId: input.memberId,
					groupId: input.groupId,
					membershipPriceCents: input.membershipPriceCents,
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
						membership_price_cents: result.membershipPriceCents,
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

			try {
				const { result, group } = await updateMemberGroupMembership({
					organizationId,
					memberId: input.memberId,
					groupId: input.groupId,
					membershipPriceCents: input.membershipPriceCents ?? null,
				});

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
						membership_price_cents: result.membershipPriceCents,
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
			const posthog = getPostHogServer();

			try {
				const { result, group } = await removeMemberGroupMembership({
					organizationId,
					memberId: input.memberId,
					groupId: input.groupId,
				});

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

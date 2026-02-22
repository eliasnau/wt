import { ORPCError } from "@orpc/server";
import { and, db, desc, eq, inArray, isNull, or, sql, wsDb } from "@repo/db";
import {
	clubMember,
	contract,
	groupMember,
	organization,
	organizationSettings,
	payment,
	paymentBatch,
} from "@repo/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../index";
import {
	loadSepaModule,
	requireSepaSettings,
	validateCreditorDetails,
} from "../lib/sepa";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";

type RemittanceContext = {
	monthName: string;
	year: string;
	memberName: string;
	memberId: string;
	joinDate: string;
};

function applyTemplate(template: string, context: RemittanceContext): string {
	return template
		.replace(/%MONTH%/g, context.monthName)
		.replace(/%YEAR%/g, context.year)
		.replace(/%MEMBER_NAME%/g, context.memberName)
		.replace(/%MEMBER_ID%/g, context.memberId)
		.replace(/%JOIN_DATE%/g, context.joinDate);
}

function clampText(value: string, max: number): string {
	if (value.length <= max) return value;
	return value.slice(0, max);
}

function normalizeSepaId(value: string, maxLength: number): string {
	const normalized = value
		.replace(/[^A-Za-z0-9+?/\-:().,' ]+/g, "")
		.replace(/^\/+/, "");
	return normalized.length <= maxLength
		? normalized
		: normalized.slice(0, maxLength);
}

function buildEndToEndId(prefix: string, paymentId: string): string {
	const raw = `${prefix}.${paymentId}`;
	if (raw.length <= 35) return raw;
	const trimmedPrefix = prefix.slice(0, 20);
	const trimmedPayment = paymentId.replace(/-/g, "").slice(0, 14);
	return `${trimmedPrefix}.${trimmedPayment}`.slice(0, 35);
}

const createPaymentBatchSchema = z.object({
	billingMonth: z
		.string()
		.regex(/^\d{4}-\d{2}-01$/, "Must be 1st day of month (YYYY-MM-01)"),
	notes: z.string().max(1000).optional(),
});

const batchIdSchema = z.object({
	id: z.string().uuid(),
});

/**
 * Calculate the last day of the month for a given date string
 */
function getLastDayOfMonth(dateStr: string): string {
	const date = new Date(dateStr);
	// Set to next month, day 0 (which is last day of current month)
	const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
	return lastDay.toISOString().split("T")[0]!;
}

/**
 * Generate a human-readable batch number
 */
function generateBatchNumber(
	billingMonth: string,
	organizationId: string,
): string {
	const date = new Date(billingMonth);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const orgShort = organizationId.substring(0, 8).toUpperCase();
	return `${year}-${month}-${orgShort}`;
}

export const paymentBatchesRouter = {
	create: protectedProcedure
		.use(rateLimitMiddleware(10))
		.use(requirePermission({ paymentBatches: ["generate"] }))
		.input(createPaymentBatchSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			// Validate that billingMonth is 1st of month
			const billingDate = new Date(input.billingMonth);
			if (billingDate.getDate() !== 1) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Billing month must be the 1st of the month",
				});
			}

			// Check if batch already exists for this org/month
			const existingBatch = await db
				.select()
				.from(paymentBatch)
				.where(
					and(
						eq(paymentBatch.organizationId, organizationId),
						eq(paymentBatch.billingMonth, input.billingMonth),
					),
				)
				.limit(1);

			if (existingBatch.length > 0) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Payment batch already exists for this month",
				});
			}

			// Start transaction to create batch and payments atomically
			const result = await wsDb.transaction(async (tx) => {
				// Find all active contracts for this organization
				// that should be billed for this month
				const activeContracts = await tx
					.select({
						contractId: contract.id,
						memberId: contract.memberId,
						joiningFeeAmount: contract.joiningFeeAmount,
						yearlyFeeAmount: contract.yearlyFeeAmount,
						joiningFeePaidAt: contract.joiningFeePaidAt,
						lastYearlyFeePaidYear: contract.lastYearlyFeePaidYear,
						startDate: contract.startDate,
						nextBillingDate: contract.nextBillingDate,
					})
					.from(contract)
					.where(
						and(
							eq(contract.organizationId, organizationId),
							// Contract has started (startDate <= billing month)
							sql`${contract.startDate}::date <= ${input.billingMonth}::date`,
							// Next billing date should be <= billing month
							sql`${contract.nextBillingDate}::date <= ${input.billingMonth}::date`,
							// Not cancelled, or cancellation effective date is after/equal billing month
							or(
								isNull(contract.cancellationEffectiveDate),
								sql`${contract.cancellationEffectiveDate}::date >= ${input.billingMonth}::date`,
							),
						),
					);

				if (activeContracts.length === 0) {
					throw new ORPCError("BAD_REQUEST", {
						message: "No active contracts to bill for this month",
					});
				}

				// Get membership amounts for each member
				const memberIds = activeContracts.map((c) => c.memberId);
				const membershipAmounts = await tx
					.select({
						memberId: groupMember.memberId,
						totalMembership: sql<string>`COALESCE(SUM(${groupMember.membershipPrice}), 0)`,
					})
					.from(groupMember)
					.where(inArray(groupMember.memberId, memberIds))
					.groupBy(groupMember.memberId);

				const membershipMap = new Map(
					membershipAmounts.map((m) => [m.memberId, m.totalMembership]),
				);

				// Calculate billing period
				const billingPeriodStart = input.billingMonth;
				const billingPeriodEnd = getLastDayOfMonth(input.billingMonth);
				const dueDate = input.billingMonth;
				const billingYear = billingDate.getFullYear();
				const billingMonthNum = billingDate.getMonth() + 1; // 1-12

				// Calculate totals and prepare payment records
				let totalAmount = 0;
				let membershipTotal = 0;
				let joiningFeeTotal = 0;
				let yearlyFeeTotal = 0;

				const paymentRecords = activeContracts.map((contractData) => {
					// Calculate membership amount
					const membershipAmount =
						Number.parseFloat(
							membershipMap.get(contractData.memberId) || "0",
						) || 0;

					// Calculate joining fee (only if not paid yet)
					const joiningFeeAmount =
						!contractData.joiningFeePaidAt && contractData.joiningFeeAmount
							? Number.parseFloat(contractData.joiningFeeAmount)
							: 0;

					// Calculate yearly fee (only in January, and only if not paid this year)
					const yearlyFeeAmount =
						billingMonthNum === 1 &&
						contractData.yearlyFeeAmount &&
						contractData.lastYearlyFeePaidYear !== billingYear
							? Number.parseFloat(contractData.yearlyFeeAmount)
							: 0;

					const total = membershipAmount + joiningFeeAmount + yearlyFeeAmount;

					// Update totals
					membershipTotal += membershipAmount;
					joiningFeeTotal += joiningFeeAmount;
					yearlyFeeTotal += yearlyFeeAmount;
					totalAmount += total;

					return {
						contractId: contractData.contractId,
						membershipAmount: membershipAmount.toFixed(2),
						joiningFeeAmount: joiningFeeAmount.toFixed(2),
						yearlyFeeAmount: yearlyFeeAmount.toFixed(2),
						totalAmount: total.toFixed(2),
						billingPeriodStart,
						billingPeriodEnd,
						dueDate,
					};
				});

				// Create the batch
				const batchNumber = generateBatchNumber(
					input.billingMonth,
					organizationId,
				);
				const [newBatch] = await tx
					.insert(paymentBatch)
					.values({
						organizationId,
						billingMonth: input.billingMonth,
						batchNumber,
						totalAmount: totalAmount.toFixed(2),
						membershipTotal: membershipTotal.toFixed(2),
						joiningFeeTotal: joiningFeeTotal.toFixed(2),
						yearlyFeeTotal: yearlyFeeTotal.toFixed(2),
						transactionCount: paymentRecords.length,
						notes: input.notes,
					})
					.returning();

				if (!newBatch) {
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: "Failed to create payment batch",
					});
				}

				// Create all payment records
				const newPayments = await tx
					.insert(payment)
					.values(
						paymentRecords.map((record) => ({
							...record,
							batchId: newBatch.id,
						})),
					)
					.returning();

				// Update contracts: mark joining fees and yearly fees as paid
				for (const contractData of activeContracts) {
					const paymentRecord = paymentRecords.find(
						(p) => p.contractId === contractData.contractId,
					);
					if (!paymentRecord) continue;

					const updates: {
						joiningFeePaidAt?: Date;
						lastYearlyFeePaidYear?: number;
						nextBillingDate?: string;
					} = {};

					// Mark joining fee as paid
					if (
						Number.parseFloat(paymentRecord.joiningFeeAmount) > 0 &&
						!contractData.joiningFeePaidAt
					) {
						updates.joiningFeePaidAt = new Date();
					}

					// Mark yearly fee as paid
					if (Number.parseFloat(paymentRecord.yearlyFeeAmount) > 0) {
						updates.lastYearlyFeePaidYear = billingYear;
					}

					// Update next billing date (move to next month)
					const nextBilling = new Date(input.billingMonth);
					nextBilling.setMonth(nextBilling.getMonth() + 1);
					updates.nextBillingDate = nextBilling.toISOString().split("T")[0]!;

					// Only update if there are changes
					if (Object.keys(updates).length > 0) {
						await tx
							.update(contract)
							.set(updates)
							.where(eq(contract.id, contractData.contractId));
					}
				}

				return {
					batch: newBatch,
					payments: newPayments,
					summary: {
						totalAmount,
						membershipTotal,
						joiningFeeTotal,
						yearlyFeeTotal,
						transactionCount: paymentRecords.length,
					},
				};
			});

			return result;
		})
		.route({ method: "POST", path: "/payment-batches" }),

	list: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ paymentBatches: ["view"] }))
		.handler(async ({ context }) => {
			const organizationId = context.session.activeOrganizationId!;

			const batches = await db
				.select({
					id: paymentBatch.id,
					billingMonth: paymentBatch.billingMonth,
					batchNumber: paymentBatch.batchNumber,
					totalAmount: paymentBatch.totalAmount,
					membershipTotal: paymentBatch.membershipTotal,
					joiningFeeTotal: paymentBatch.joiningFeeTotal,
					yearlyFeeTotal: paymentBatch.yearlyFeeTotal,
					transactionCount: paymentBatch.transactionCount,
					notes: paymentBatch.notes,
					createdAt: paymentBatch.createdAt,
				})
				.from(paymentBatch)
				.where(eq(paymentBatch.organizationId, organizationId))
				.orderBy(desc(paymentBatch.billingMonth));

			return batches;
		})
		.route({ method: "GET", path: "/payment-batches" }),

	view: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ paymentBatches: ["view"] }))
		.input(batchIdSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			// Get batch info
			const [batch] = await db
				.select()
				.from(paymentBatch)
				.where(
					and(
						eq(paymentBatch.id, input.id),
						eq(paymentBatch.organizationId, organizationId),
					),
				)
				.limit(1);

			if (!batch) {
				throw new ORPCError("NOT_FOUND", {
					message: "Payment batch not found",
				});
			}

			// Get all payments for this batch with member info
			const payments = await db
				.select({
					id: payment.id,
					contractId: payment.contractId,
					membershipAmount: payment.membershipAmount,
					joiningFeeAmount: payment.joiningFeeAmount,
					yearlyFeeAmount: payment.yearlyFeeAmount,
					totalAmount: payment.totalAmount,
					billingPeriodStart: payment.billingPeriodStart,
					billingPeriodEnd: payment.billingPeriodEnd,
					dueDate: payment.dueDate,
					notes: payment.notes,
					createdAt: payment.createdAt,
					// Member info
					memberId: clubMember.id,
					memberFirstName: clubMember.firstName,
					memberLastName: clubMember.lastName,
					memberEmail: clubMember.email,
				})
				.from(payment)
				.innerJoin(contract, eq(payment.contractId, contract.id))
				.innerJoin(clubMember, eq(contract.memberId, clubMember.id))
				.where(eq(payment.batchId, input.id))
				.orderBy(clubMember.lastName, clubMember.firstName);

			return {
				batch,
				payments,
			};
		})
		.route({ method: "GET", path: "/payment-batches/:id" }),

	exportSepa: protectedProcedure
		.use(rateLimitMiddleware(3))
		.use(requirePermission({ paymentBatches: ["download"] }))
		.input(batchIdSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;

			const [batch] = await db
				.select({
					id: paymentBatch.id,
					billingMonth: paymentBatch.billingMonth,
					batchNumber: paymentBatch.batchNumber,
					organizationName: organization.name,
				})
				.from(paymentBatch)
				.innerJoin(
					organization,
					eq(paymentBatch.organizationId, organization.id),
				)
				.where(
					and(
						eq(paymentBatch.id, input.id),
						eq(paymentBatch.organizationId, organizationId),
					),
				)
				.limit(1);

			if (!batch) {
				throw new ORPCError("NOT_FOUND", {
					message: "Payment batch not found",
				});
			}

			const [sepaRow] = await db
				.select()
				.from(organizationSettings)
				.where(eq(organizationSettings.organizationId, organizationId))
				.limit(1);

			const sepaSettings = requireSepaSettings(sepaRow);

			const payments = await db
				.select({
					id: payment.id,
					contractId: payment.contractId,
					totalAmount: payment.totalAmount,
					membershipAmount: payment.membershipAmount,
					joiningFeeAmount: payment.joiningFeeAmount,
					yearlyFeeAmount: payment.yearlyFeeAmount,
					dueDate: payment.dueDate,
					contractStartDate: contract.startDate,
					memberId: clubMember.id,
					memberFirstName: clubMember.firstName,
					memberLastName: clubMember.lastName,
					memberIban: clubMember.iban,
					memberBic: clubMember.bic,
					memberCardHolder: clubMember.cardHolder,
				})
				.from(payment)
				.innerJoin(contract, eq(payment.contractId, contract.id))
				.innerJoin(clubMember, eq(contract.memberId, clubMember.id))
				.where(
					and(
						eq(payment.batchId, input.id),
						eq(contract.organizationId, organizationId),
					),
				)
				.orderBy(clubMember.lastName, clubMember.firstName);

			if (payments.length === 0) {
				throw new ORPCError("BAD_REQUEST", {
					message: "No payments found for this batch",
				});
			}

			const sepa = await loadSepaModule();
			validateCreditorDetails(sepa, sepaSettings);

			const invalidMembers: string[] = [];
			const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;

			for (const paymentRow of payments) {
				if (
					!paymentRow.memberIban ||
					!paymentRow.memberBic ||
					!paymentRow.memberCardHolder
				) {
					invalidMembers.push(
						`${paymentRow.memberFirstName} ${paymentRow.memberLastName}`.trim(),
					);
					continue;
				}

				if (!sepa.validateIBAN(paymentRow.memberIban)) {
					invalidMembers.push(
						`${paymentRow.memberFirstName} ${paymentRow.memberLastName}`.trim(),
					);
				}

				if (!bicRegex.test(paymentRow.memberBic)) {
					invalidMembers.push(
						`${paymentRow.memberFirstName} ${paymentRow.memberLastName}`.trim(),
					);
				}

				const amount = Number.parseFloat(paymentRow.totalAmount);
				if (!Number.isFinite(amount) || amount <= 0) {
					invalidMembers.push(
						`${paymentRow.memberFirstName} ${paymentRow.memberLastName}`.trim(),
					);
				}
			}

			if (invalidMembers.length > 0) {
				const sample = invalidMembers.slice(0, 3).join(", ");
				throw new ORPCError("BAD_REQUEST", {
					message: `SEPA export blocked. ${invalidMembers.length} member records are missing valid bank details or amounts. Fix them and try again. Example(s): ${sample}`,
				});
			}

			const doc = new sepa.Document("pain.008.001.08");
			const batchLabel = batch.batchNumber ?? batch.id;
			doc.grpHdr.id = batchLabel;
			doc.grpHdr.created = new Date();
			doc.grpHdr.initiatorName =
				sepaSettings.initiatorName ?? sepaSettings.creditorName;

			const info = doc.createPaymentInfo();
			info.collectionDate = new Date(batch.billingMonth);
			info.creditorIBAN = sepaSettings.creditorIban;
			info.creditorBIC = sepaSettings.creditorBic;
			info.creditorName = sepaSettings.creditorName;
			info.creditorId = sepaSettings.creditorId;
			if (typeof sepaSettings.batchBooking === "boolean") {
				info.batchBooking = sepaSettings.batchBooking;
			}

			doc.addPaymentInfo(info);

			const monthName = new Intl.DateTimeFormat("en-US", {
				month: "long",
			}).format(new Date(batch.billingMonth));
			const year = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(
				new Date(batch.billingMonth),
			);

			for (const paymentRow of payments) {
				const amount = Number.parseFloat(paymentRow.totalAmount);
				const memberName =
					paymentRow.memberCardHolder ||
					`${paymentRow.memberFirstName} ${paymentRow.memberLastName}`.trim();
				const joinDate = new Date(paymentRow.contractStartDate)
					.toISOString()
					.split("T")[0]!;

				const context: RemittanceContext = {
					monthName,
					year,
					memberName,
					memberId: paymentRow.memberId,
					joinDate,
				};

				const remittanceParts: string[] = [];
				const membershipAmount = Number.parseFloat(paymentRow.membershipAmount);
				const joiningFeeAmount = Number.parseFloat(paymentRow.joiningFeeAmount);
				const yearlyFeeAmount = Number.parseFloat(paymentRow.yearlyFeeAmount);

				if (membershipAmount > 0) {
					const template =
						sepaSettings.remittanceTemplates?.membership ??
						"Membership fee for %MONTH% %YEAR%";
					remittanceParts.push(applyTemplate(template, context));
				}
				if (joiningFeeAmount > 0) {
					const template =
						sepaSettings.remittanceTemplates?.joiningFee ??
						"Joining fee for %MEMBER_NAME%";
					remittanceParts.push(applyTemplate(template, context));
				}
				if (yearlyFeeAmount > 0) {
					const template =
						sepaSettings.remittanceTemplates?.yearlyFee ??
						"Annual fee for %YEAR%";
					remittanceParts.push(applyTemplate(template, context));
				}

				const remittanceInfo = clampText(
					remittanceParts.join(" / ") || "Membership fee",
					140,
				);

				const tx = info.createTransaction();
				tx.debtorName = memberName;
				tx.debtorIBAN = paymentRow.memberIban;
				tx.debtorBIC = paymentRow.memberBic;
				tx.mandateId = normalizeSepaId(paymentRow.contractId, 35);
				tx.mandateSignatureDate = new Date(paymentRow.contractStartDate);
				tx.amount = amount;
				tx.currency = "EUR";
				tx.remittanceInfo = remittanceInfo;
				tx.end2endId = normalizeSepaId(
					buildEndToEndId(batchLabel, paymentRow.id),
					35,
				);
				info.addTransaction(tx);
			}

			let xml = "";
			try {
				xml = doc.toString();
			} catch (error) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						error instanceof Error
							? `SEPA export failed: ${error.message}`
							: "SEPA export failed. Please verify the bank details.",
				});
			}
			const sanitizedLabel = batchLabel.replace(/[^a-zA-Z0-9-_]/g, "-");
			const fileName = `sepa-${sanitizedLabel}.xml`;

			return {
				fileName,
				xml,
			};
		})
		.route({ method: "GET", path: "/payment-batches/:id/sepa" }),
};

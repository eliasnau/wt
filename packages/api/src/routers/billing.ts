import { ORPCError } from "@orpc/server";
import {
	and,
	asc,
	db,
	desc,
	eq,
	inArray,
	isNull,
	or,
	sql,
	wsDb,
} from "@repo/db";
import {
	clubMember,
	contract,
	creditGrant,
	group,
	groupMember,
	invoice,
	invoiceLine,
	organizationSettings,
	sepaBatch,
	sepaBatchItem,
	sepaMandate,
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

const ymdSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)");

const monthStartSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-01$/, "Must be 1st day of month (YYYY-MM-01)");

const invoiceStatusSchema = z.enum(["draft", "finalized", "void"]);
const creditGrantTypeSchema = z.enum(["money", "billing_cycles"]);

const generateInvoicesSchema = z.object({
	targetMonth: monthStartSchema,
	currency: z.string().default("EUR"),
});

const listInvoicesSchema = z.object({
	memberId: z.string().optional(),
	contractId: z.string().uuid().optional(),
	status: invoiceStatusSchema.optional(),
	from: ymdSchema.optional(),
	to: ymdSchema.optional(),
});

const invoiceIdSchema = z.object({
	id: z.string().uuid(),
});

const voidInvoiceSchema = z.object({
	id: z.string().uuid(),
	reason: z.string().min(1).max(1000),
});

const replaceInvoiceSchema = z.object({
	id: z.string().uuid(),
	reason: z.string().min(1).max(1000),
});

const createCreditGrantSchema = z
	.object({
		memberId: z.string(),
		contractId: z.string().uuid(),
		type: creditGrantTypeSchema,
		description: z.string().max(255).optional(),
		notes: z.string().max(1000).optional(),
		validFrom: ymdSchema.optional(),
		expiresAt: ymdSchema.optional(),
		originalAmountCents: z.number().int().nonnegative().optional(),
		originalCycles: z.number().int().positive().optional(),
	})
	.superRefine((value, ctx) => {
		if (value.type === "money" && value.originalAmountCents === undefined) {
			ctx.addIssue({
				code: "custom",
				message: "originalAmountCents is required for money credits",
				path: ["originalAmountCents"],
			});
		}

		if (value.type === "billing_cycles" && value.originalCycles === undefined) {
			ctx.addIssue({
				code: "custom",
				message: "originalCycles is required for billing cycle credits",
				path: ["originalCycles"],
			});
		}
	});

const listCreditGrantsSchema = z.object({
	memberId: z.string().optional(),
	contractId: z.string().uuid().optional(),
});

const createSepaMandateSchema = z.object({
	memberId: z.string(),
	contractId: z.string().uuid(),
	mandateReference: z.string().min(1).max(35),
	accountHolder: z.string().min(1).max(255),
	iban: z.string().min(1).max(64),
	bic: z.string().min(1).max(11),
	signatureDate: ymdSchema,
});

const listSepaMandatesSchema = z.object({
	memberId: z.string().optional(),
	contractId: z.string().uuid().optional(),
});

const revokeSepaMandateSchema = z.object({
	id: z.string().uuid(),
});

const previewSepaBatchSchema = z.object({
	collectionDate: ymdSchema,
});

const generateSepaBatchSchema = z.object({
	collectionDate: ymdSchema,
	notes: z.string().max(1000).optional(),
});

const markBatchDownloadedSchema = z.object({
	id: z.string().uuid(),
});

const updateBatchStatusSchema = z.object({
	id: z.string().uuid(),
});

const ACTIVE_CONTRACT_STATUSES = new Set(["active", "cancelled"]);
const ACTIVE_BATCH_STATUSES = new Set(["generated", "downloaded"]);

type InvoiceLineDraft = Omit<typeof invoiceLine.$inferInsert, "invoiceId">;
type InvoiceInsert = typeof invoice.$inferInsert;
type BillingTx = Parameters<Parameters<typeof wsDb.transaction>[0]>[0];

function parseDateOnly(dateStr: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
	if (!match) return null;
	return {
		year: Number(match[1]),
		month: Number(match[2]),
		day: Number(match[3]),
	};
}

function formatDateOnly(year: number, month: number, day: number) {
	return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function firstDayOfMonth(dateStr: string) {
	const parsed = parseDateOnly(dateStr);
	if (!parsed) throw new Error("Invalid date");
	return formatDateOnly(parsed.year, parsed.month, 1);
}

function lastDayOfMonth(dateStr: string) {
	const parsed = parseDateOnly(dateStr);
	if (!parsed) throw new Error("Invalid date");
	return formatDateOnly(
		parsed.year,
		parsed.month,
		new Date(parsed.year, parsed.month, 0).getDate(),
	);
}

function addMonths(dateStr: string, months: number) {
	const parsed = parseDateOnly(dateStr);
	if (!parsed) throw new Error("Invalid date");
	const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + months, 1));
	return formatDateOnly(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

function getMonthLabel(dateStr: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${dateStr}T00:00:00.000Z`));
}

function getYearlyCycleKey(monthStart: string, contractStartDate: string) {
	const month = monthStart.slice(5, 7);
	const startMonth = contractStartDate.slice(5, 7);
	const year = Number(monthStart.slice(0, 4));
	return month >= startMonth ? `${year}-${startMonth}` : `${year - 1}-${startMonth}`;
}

function getMonthNumber(dateStr: string) {
	return Number(dateStr.slice(5, 7));
}

function buildBatchNumber(
	organizationId: string,
	collectionDate: string,
	sequenceNumber: number,
) {
	return `${collectionDate}-${String(sequenceNumber).padStart(2, "0")}-${organizationId.slice(0, 8).toUpperCase()}`;
}

async function ensureInvoiceNotExported(invoiceId: string) {
	const existing = await db
		.select({
			status: sepaBatch.status,
		})
		.from(sepaBatchItem)
		.innerJoin(sepaBatch, eq(sepaBatch.id, sepaBatchItem.sepaBatchId))
		.where(eq(sepaBatchItem.invoiceId, invoiceId));

	if (existing.some((row) => ACTIVE_BATCH_STATUSES.has(row.status))) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Exported invoices cannot be directly changed",
		});
	}
}

type SequenceQueryExecutor = Pick<typeof db, "select" | "execute">;

async function getNextBatchSequenceNumber(
	executor: SequenceQueryExecutor,
	organizationId: string,
	collectionDate: string,
) {
	const lockKey = `${organizationId}:${collectionDate}`;
	await executor.execute(
		sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`,
	);

	const [result] = await executor
		.select({
			maxSequence: sql<number>`COALESCE(MAX(${sepaBatch.sequenceNumber}), 0)`,
		})
		.from(sepaBatch)
		.where(
			and(
				eq(sepaBatch.organizationId, organizationId),
				eq(sepaBatch.collectionDate, collectionDate),
			),
		);

	return (result?.maxSequence ?? 0) + 1;
}

async function buildSepaBatchXml({
	organizationId,
	batchId,
}: {
	organizationId: string;
	batchId: string;
}) {
	const [batch] = await db
		.select()
		.from(sepaBatch)
		.where(and(eq(sepaBatch.id, batchId), eq(sepaBatch.organizationId, organizationId)))
		.limit(1);

	if (!batch) {
		throw new ORPCError("NOT_FOUND", { message: "SEPA batch not found" });
	}

	if (batch.status !== "generated" && batch.status !== "downloaded") {
		throw new ORPCError("BAD_REQUEST", {
			message: "SEPA batch is not available for download",
		});
	}

	const [sepaRow] = await db
		.select()
		.from(organizationSettings)
		.where(eq(organizationSettings.organizationId, organizationId))
		.limit(1);
	const sepaSettings = requireSepaSettings(sepaRow);
	const sepa = await loadSepaModule();
	validateCreditorDetails(sepa, sepaSettings);

	const items = await db
		.select({
			invoiceId: sepaBatchItem.invoiceId,
			amountCents: sepaBatchItem.amountCents,
			memberId: invoice.memberId,
			contractId: invoice.contractId,
			memberFirstName: clubMember.firstName,
			memberLastName: clubMember.lastName,
			billingPeriodStart: invoice.billingPeriodStart,
		})
		.from(sepaBatchItem)
		.innerJoin(invoice, eq(invoice.id, sepaBatchItem.invoiceId))
		.innerJoin(clubMember, eq(clubMember.id, invoice.memberId))
		.where(
			and(
				eq(sepaBatchItem.organizationId, organizationId),
				eq(sepaBatchItem.sepaBatchId, batchId),
				eq(sepaBatchItem.status, "included"),
			),
		)
		.orderBy(asc(clubMember.lastName), asc(clubMember.firstName));

	if (items.length === 0) {
		throw new ORPCError("BAD_REQUEST", {
			message: "SEPA batch has no included invoices",
		});
	}

	const activeMandates = await db
		.select()
		.from(sepaMandate)
		.where(
			and(
				eq(sepaMandate.organizationId, organizationId),
				eq(sepaMandate.isActive, true),
				isNull(sepaMandate.revokedAt),
				inArray(
					sepaMandate.contractId,
					Array.from(new Set(items.map((item) => item.contractId))),
				),
			),
		);
	const activeMandateByContractId = new Map(
		activeMandates.map((mandate) => [mandate.contractId, mandate]),
	);

	const document = new sepa.Document("pain.008.001.02");
	document.grpHdr.id = batch.batchNumber;
	document.grpHdr.created = new Date();
	document.grpHdr.initiatorName =
		sepaRow?.initiatorName || sepaSettings.creditorName;

	const paymentInfo = document.createPaymentInfo();
	paymentInfo.collectionDate = new Date(`${batch.collectionDate}T00:00:00.000Z`);
	paymentInfo.creditorIBAN = sepaSettings.creditorIban;
	paymentInfo.creditorBIC = sepaSettings.creditorBic;
	paymentInfo.creditorName = sepaSettings.creditorName;
	paymentInfo.creditorId = sepaSettings.creditorId;
	paymentInfo.batchBooking = sepaRow?.batchBooking ?? true;

	for (const item of items) {
		const mandate = activeMandateByContractId.get(item.contractId);
		if (!mandate) {
			throw new ORPCError("BAD_REQUEST", {
				message: `Missing active mandate for invoice ${item.invoiceId}`,
			});
		}

		const tx = paymentInfo.createTransaction();
		tx.debtorName = `${item.memberFirstName} ${item.memberLastName}`.trim();
		tx.debtorIBAN = mandate.iban.replace(/\s+/g, "").toUpperCase();
		tx.debtorBIC = mandate.bic.replace(/\s+/g, "").toUpperCase();
		tx.mandateId = mandate.mandateReference;
		tx.mandateSignatureDate = new Date(`${mandate.signatureDate}T00:00:00.000Z`);
		tx.amount = item.amountCents / 100;
		tx.currency = "EUR";
		tx.remittanceInfo = `Invoice ${item.billingPeriodStart}`;
		tx.end2endId = `${batch.batchNumber}.${item.invoiceId}`.slice(0, 35);
		paymentInfo.addTransaction(tx);
	}

	document.addPaymentInfo(paymentInfo);

	return {
		batch,
		xml: document.toString(),
	};
}

async function getNonVoidInvoiceMonths(
	contractId: string,
	months: string[],
) {
	if (months.length === 0) {
		return new Set<string>();
	}

	const existing = await db
		.select({
			billingPeriodStart: invoice.billingPeriodStart,
		})
		.from(invoice)
		.where(
			and(
				eq(invoice.contractId, contractId),
				inArray(invoice.billingPeriodStart, months),
				sql`${invoice.status} <> 'void'`,
			),
		);

	return new Set(existing.map((row) => row.billingPeriodStart));
}

async function hasNonVoidInvoiceLine({
	contractId,
	type,
	year,
	cycleKey,
	contractStartDate,
}: {
	contractId: string;
	type: string;
	year?: number;
	cycleKey?: string;
	contractStartDate?: string;
}) {
	const rows = await db
		.select({
			coverageStart: invoiceLine.coverageStart,
		})
		.from(invoiceLine)
		.innerJoin(invoice, eq(invoice.id, invoiceLine.invoiceId))
		.where(
			and(
				eq(invoice.contractId, contractId),
				eq(invoiceLine.type, type),
				sql`${invoice.status} <> 'void'`,
			),
		);

	if (year !== undefined) {
		return rows.some(
			(row) =>
				row.coverageStart !== null &&
				Number(row.coverageStart.slice(0, 4)) === year,
		);
	}

	if (cycleKey !== undefined) {
		return rows.some(
			(row) =>
				row.coverageStart !== null &&
				getYearlyCycleKey(
					row.coverageStart,
					contractStartDate ?? row.coverageStart,
				) === cycleKey,
		);
	}

	return rows.length > 0;
}

async function getContractGroupCharges(memberId: string) {
	return db
		.select({
			groupId: groupMember.groupId,
			groupName: group.name,
			membershipPriceCents: groupMember.membershipPriceCents,
		})
		.from(groupMember)
		.innerJoin(group, eq(group.id, groupMember.groupId))
		.where(eq(groupMember.memberId, memberId))
		.orderBy(asc(group.name));
}

function applyInvoiceTotal(lines: InvoiceLineDraft[]) {
	return lines.reduce((sum, line) => sum + line.totalAmountCents, 0);
}

async function createInvoiceWithLines(tx: BillingTx, params: {
	invoice: InvoiceInsert;
	lines: InvoiceLineDraft[];
}) {
	const [createdInvoice] = await tx
		.insert(invoice)
		.values(params.invoice)
		.returning();

	if (!createdInvoice) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to create invoice",
		});
	}

	if (params.lines.length > 0) {
		await tx.insert(invoiceLine).values(
			params.lines.map((line) => ({
				...line,
				invoiceId: createdInvoice.id,
			})),
		);
	}

	const totalCents = applyInvoiceTotal(params.lines);
	const [finalizedInvoice] = await tx
		.update(invoice)
		.set({
			status: "finalized",
			totalCents,
			finalizedAt: new Date(),
		})
		.where(eq(invoice.id, createdInvoice.id))
		.returning();

	if (!finalizedInvoice) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to finalize invoice",
		});
	}

	return finalizedInvoice;
}

async function applyCredits({
	tx,
	organizationId,
	memberId,
	contractId,
	monthStart,
	lines,
}: {
	tx: BillingTx;
	organizationId: string;
	memberId: string;
	contractId: string;
	monthStart: string;
	lines: InvoiceLineDraft[];
}) {
	let balance = applyInvoiceTotal(lines);
	if (balance <= 0) {
		return;
	}

	const grants = await tx
		.select()
		.from(creditGrant)
		.where(
			and(
				eq(creditGrant.organizationId, organizationId),
				eq(creditGrant.memberId, memberId),
				eq(creditGrant.contractId, contractId),
				or(
					isNull(creditGrant.validFrom),
					sql`${creditGrant.validFrom} <= ${monthStart}`,
				),
				or(
					isNull(creditGrant.expiresAt),
					sql`${creditGrant.expiresAt} >= ${monthStart}`,
				),
			),
		)
		.orderBy(asc(creditGrant.createdAt));

	for (const grant of grants) {
		if (balance <= 0) break;

		if (grant.type === "billing_cycles" && (grant.remainingCycles ?? 0) > 0) {
			const membershipTotal = lines
				.filter((line) => line.type === "membership_fee")
				.reduce((sum, line) => sum + line.totalAmountCents, 0);
			const appliedCycleCredits = lines
				.filter((line) => line.type === "credit_cycle")
				.reduce((sum, line) => sum + line.totalAmountCents, 0);
			const remainingMembershipTotal = Math.max(
				0,
				membershipTotal + appliedCycleCredits,
			);

			if (remainingMembershipTotal > 0) {
				lines.push({
					organizationId,
					type: "credit_cycle",
					description: "Billing cycle credit applied",
					quantity: 1,
					unitAmountCents: -remainingMembershipTotal,
					totalAmountCents: -remainingMembershipTotal,
					coverageStart: monthStart,
					coverageEnd: lastDayOfMonth(monthStart),
					creditGrantId: grant.id,
				});
				balance -= remainingMembershipTotal;
				await tx
					.update(creditGrant)
					.set({ remainingCycles: (grant.remainingCycles ?? 0) - 1 })
					.where(eq(creditGrant.id, grant.id));
			}
		}
	}

	if (balance <= 0) {
		return;
	}

	const moneyGrants = grants.filter(
		(grant) => grant.type === "money" && (grant.remainingAmountCents ?? 0) > 0,
	);
	for (const grant of moneyGrants) {
		if (balance <= 0) break;
		const amountToApply = Math.min(balance, grant.remainingAmountCents ?? 0);
		if (amountToApply <= 0) continue;

		lines.push({
			organizationId,
			type: "credit_money",
			description: "Money credit applied",
			quantity: 1,
			unitAmountCents: -amountToApply,
			totalAmountCents: -amountToApply,
			coverageStart: monthStart,
			coverageEnd: lastDayOfMonth(monthStart),
			creditGrantId: grant.id,
		});
		balance -= amountToApply;
		await tx
			.update(creditGrant)
			.set({ remainingAmountCents: (grant.remainingAmountCents ?? 0) - amountToApply })
			.where(eq(creditGrant.id, grant.id));
	}
}

async function restoreCreditGrants(
	tx: BillingTx,
	lines: { type: string; totalAmountCents: number; creditGrantId: string | null }[],
) {
	for (const line of lines) {
		if (!line.creditGrantId) continue;

		if (line.type === "credit_money") {
			await tx
				.update(creditGrant)
				.set({
					remainingAmountCents: sql`${creditGrant.remainingAmountCents} + ${Math.abs(line.totalAmountCents)}`,
				})
				.where(eq(creditGrant.id, line.creditGrantId));
		} else if (line.type === "credit_cycle") {
			await tx
				.update(creditGrant)
				.set({
					remainingCycles: sql`${creditGrant.remainingCycles} + 1`,
				})
				.where(eq(creditGrant.id, line.creditGrantId));
		}
	}
}

async function buildChargeLinesForMonth({
	organizationId,
	contractRow,
	monthStart,
	chargeJoiningFee,
	chargeYearlyFee,
}: {
	organizationId: string;
	contractRow: typeof contract.$inferSelect;
	monthStart: string;
	chargeJoiningFee: boolean;
	chargeYearlyFee: boolean;
}) {
	const lines: InvoiceLineDraft[] = [];
	const groupCharges = await getContractGroupCharges(contractRow.memberId);

	for (const groupCharge of groupCharges) {
		lines.push({
			organizationId,
			type: "membership_fee",
			description: `Membership fee: ${groupCharge.groupName}`,
			quantity: 1,
			unitAmountCents: groupCharge.membershipPriceCents,
			totalAmountCents: groupCharge.membershipPriceCents,
			coverageStart: monthStart,
			coverageEnd: lastDayOfMonth(monthStart),
			groupId: groupCharge.groupId,
		});
	}

	if (chargeJoiningFee && (contractRow.joiningFeeCents ?? 0) > 0) {
		lines.push({
			organizationId,
			type: "joining_fee",
			description: "Joining fee",
			quantity: 1,
			unitAmountCents: contractRow.joiningFeeCents ?? 0,
			totalAmountCents: contractRow.joiningFeeCents ?? 0,
			coverageStart: monthStart,
			coverageEnd: lastDayOfMonth(monthStart),
		});
	}

	if (chargeYearlyFee && (contractRow.yearlyFeeCents ?? 0) > 0) {
		lines.push({
			organizationId,
			type: "yearly_fee",
			description:
				contractRow.yearlyFeeMode === "anniversary"
					? "Annual fee (anniversary)"
					: "Annual fee (January)",
			quantity: 1,
			unitAmountCents: contractRow.yearlyFeeCents ?? 0,
			totalAmountCents: contractRow.yearlyFeeCents ?? 0,
			coverageStart: monthStart,
			coverageEnd: lastDayOfMonth(monthStart),
		});
	}

	return lines;
}

async function setJoiningFeePaidState(
	tx: BillingTx,
	contractId: string,
	joiningFeePaid: boolean,
) {
	await tx
		.update(contract)
		.set({ joiningFeePaid })
		.where(eq(contract.id, contractId));
}

async function generateInvoicesForMonth({
	organizationId,
	targetMonth,
	currency,
}: {
	organizationId: string;
	targetMonth: string;
	currency: string;
}) {
	const contracts = await db
		.select()
		.from(contract)
		.where(eq(contract.organizationId, organizationId));

	const createdInvoices: typeof invoice.$inferSelect[] = [];

	for (const contractRow of contracts) {
		if (!ACTIVE_CONTRACT_STATUSES.has(contractRow.status)) {
			continue;
		}

		if (contractRow.startDate > targetMonth) {
			continue;
		}

		if (
			contractRow.cancellationEffectiveDate &&
			contractRow.cancellationEffectiveDate < targetMonth
		) {
			continue;
		}

		const settledThroughMonth = contractRow.settledThroughDate
			? addMonths(firstDayOfMonth(contractRow.settledThroughDate), 1)
			: contractRow.startDate;
		const firstBillableMonth =
			settledThroughMonth > contractRow.startDate
				? settledThroughMonth
				: contractRow.startDate;

		const monthsToConsider: string[] = [];
		let cursor = firstBillableMonth;
		while (cursor <= targetMonth) {
			monthsToConsider.push(cursor);
			cursor = addMonths(cursor, 1);
		}

		const existingMonths = await getNonVoidInvoiceMonths(
			contractRow.id,
			monthsToConsider,
		);
		const missingMonths = monthsToConsider.filter((month) => !existingMonths.has(month));
		if (missingMonths.length === 0) {
			continue;
		}

		const historicalMissed = missingMonths.filter((month) => month < targetMonth);
		const collectibleArrearsMonth =
			historicalMissed.length > 0
				? historicalMissed[historicalMissed.length - 1]
				: undefined;
		const waivedMonths = historicalMissed.filter(
			(month) => month !== collectibleArrearsMonth,
		);

		let joiningFeeConsumed = contractRow.joiningFeePaid;

		for (const month of missingMonths) {
			const shouldWaive = waivedMonths.includes(month);
			const isCollectibleArrearsMonth = month === collectibleArrearsMonth;
			const shouldCreateCurrent = month === targetMonth;
			const shouldCreateCollectible = isCollectibleArrearsMonth || shouldCreateCurrent;
			const year = Number(month.slice(0, 4));

			const yearlyFeeAlreadyBilled =
				contractRow.yearlyFeeMode === "anniversary"
					? await hasNonVoidInvoiceLine({
							contractId: contractRow.id,
							type: "yearly_fee",
							cycleKey: getYearlyCycleKey(month, contractRow.startDate),
							contractStartDate: contractRow.startDate,
						})
					: await hasNonVoidInvoiceLine({
							contractId: contractRow.id,
							type: "yearly_fee",
							year,
						});

			const yearlyFeeDue =
				!yearlyFeeAlreadyBilled &&
				(contractRow.yearlyFeeMode === "anniversary"
					? getMonthNumber(month) === getMonthNumber(contractRow.startDate)
					: getMonthNumber(month) === 1);

			const lines = await buildChargeLinesForMonth({
				organizationId,
				contractRow,
				monthStart: month,
				chargeJoiningFee: shouldCreateCurrent && !joiningFeeConsumed,
				chargeYearlyFee: yearlyFeeDue,
			});

			if (lines.length === 0) {
				continue;
			}

			if (shouldWaive) {
				const positiveLines = [...lines];
				for (const line of positiveLines) {
					lines.push({
						organizationId,
						type: "waiver",
						description: `Waived charge for ${getMonthLabel(month)}: ${line.description}`,
						quantity: 1,
						unitAmountCents: -line.totalAmountCents,
						totalAmountCents: -line.totalAmountCents,
						coverageStart: line.coverageStart,
						coverageEnd: line.coverageEnd,
						groupId: line.groupId,
					});
				}
			} else if (isCollectibleArrearsMonth) {
				for (const line of lines) {
					line.type = line.type === "membership_fee" ? "arrears" : line.type;
					line.description = `Arrears for ${getMonthLabel(month)}: ${line.description}`;
				}
			}

			if (!shouldWaive && shouldCreateCollectible) {
				const { finalized, didChargeJoiningFee } = await wsDb.transaction(
					async (tx) => {
					await applyCredits({
						tx,
						organizationId,
						memberId: contractRow.memberId,
						contractId: contractRow.id,
						monthStart: month,
						lines,
					});
					const finalized = await createInvoiceWithLines(tx, {
						invoice: {
							organizationId,
							memberId: contractRow.memberId,
							contractId: contractRow.id,
							billingPeriodStart: month,
							billingPeriodEnd: lastDayOfMonth(month),
							status: "draft",
							currency,
						},
						lines,
					});
					const didChargeJoiningFee = lines.some(
						(line) => line.type === "joining_fee",
					);

					if (didChargeJoiningFee) {
						await setJoiningFeePaidState(tx, contractRow.id, true);
					}

					return { finalized, didChargeJoiningFee };
				});
				createdInvoices.push(finalized);
				if (didChargeJoiningFee) {
					joiningFeeConsumed = true;
				}
			} else if (shouldWaive) {
				await wsDb.transaction(async (tx) => {
					const finalized = await createInvoiceWithLines(tx, {
						invoice: {
							organizationId,
							memberId: contractRow.memberId,
							contractId: contractRow.id,
							billingPeriodStart: month,
							billingPeriodEnd: lastDayOfMonth(month),
							status: "draft",
							currency,
						},
						lines,
					});
					createdInvoices.push(finalized);
				});
			}
		}
	}

	return createdInvoices;
}

async function listEligibleInvoicesForBatch({
	organizationId,
	collectionDate,
}: {
	organizationId: string;
	collectionDate: string;
}) {
	const invoices = await db
			.select({
				id: invoice.id,
				memberId: invoice.memberId,
				contractId: invoice.contractId,
				status: invoice.status,
				totalCents: invoice.totalCents,
				billingPeriodStart: invoice.billingPeriodStart,
				billingPeriodEnd: invoice.billingPeriodEnd,
				memberFirstName: clubMember.firstName,
			memberLastName: clubMember.lastName,
		})
			.from(invoice)
			.innerJoin(clubMember, eq(clubMember.id, invoice.memberId))
			.where(
				eq(invoice.organizationId, organizationId),
			)
			.orderBy(
				asc(invoice.billingPeriodStart),
				asc(clubMember.lastName),
				asc(clubMember.firstName),
			);

	const exportedInvoiceIds = new Set(
		(
			await db
				.select({
					invoiceId: sepaBatchItem.invoiceId,
					status: sepaBatch.status,
				})
				.from(sepaBatchItem)
				.innerJoin(sepaBatch, eq(sepaBatch.id, sepaBatchItem.sepaBatchId))
				.where(eq(sepaBatchItem.organizationId, organizationId))
		)
			.filter((row) => ACTIVE_BATCH_STATUSES.has(row.status))
			.map((row) => row.invoiceId),
	);

	const mandates = await db
		.select({
			contractId: sepaMandate.contractId,
			id: sepaMandate.id,
		})
		.from(sepaMandate)
		.where(
			and(
				eq(sepaMandate.organizationId, organizationId),
				eq(sepaMandate.isActive, true),
				isNull(sepaMandate.revokedAt),
			),
		);
	const mandateMap = new Map(mandates.map((row) => [row.contractId, row.id]));

	const includedInvoices = [];
	const excludedInvoices = [];

	for (const currentInvoice of invoices) {
		let exclusionReason: string | null = null;

		if (currentInvoice.status !== "finalized") {
			exclusionReason = "invoice_not_finalized";
		} else if (currentInvoice.totalCents <= 0) {
			exclusionReason = "total_is_zero";
		} else if (exportedInvoiceIds.has(currentInvoice.id)) {
			exclusionReason = "already_exported";
		} else if (!mandateMap.has(currentInvoice.contractId)) {
			exclusionReason = "missing_active_mandate";
		}

		if (exclusionReason) {
			excludedInvoices.push({
				...currentInvoice,
				reason: exclusionReason,
			});
		} else {
			includedInvoices.push({
				...currentInvoice,
				sepaMandateId: mandateMap.get(currentInvoice.contractId)!,
			});
		}
	}

	return {
		includedInvoices,
		excludedInvoices,
	};
}

export const billingRouter = {
	generateInvoices: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["generate"] }))
		.input(generateInvoicesSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
				const createdInvoices = await generateInvoicesForMonth({
					organizationId,
					targetMonth: input.targetMonth,
					currency: input.currency,
				});

			return {
				targetMonth: input.targetMonth,
				createdCount: createdInvoices.length,
				invoices: createdInvoices,
			};
		})
		.route({ method: "POST", path: "/billing/invoices/generate" }),

	listInvoices: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["view"] }))
		.input(listInvoicesSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const conditions = [
				eq(invoice.organizationId, organizationId),
				input.memberId ? eq(invoice.memberId, input.memberId) : undefined,
				input.contractId ? eq(invoice.contractId, input.contractId) : undefined,
				input.status ? eq(invoice.status, input.status) : undefined,
				input.from ? sql`${invoice.billingPeriodStart} >= ${input.from}` : undefined,
				input.to ? sql`${invoice.billingPeriodStart} <= ${input.to}` : undefined,
			].filter(Boolean);

			return db
				.select({
					id: invoice.id,
						memberId: invoice.memberId,
						contractId: invoice.contractId,
						billingPeriodStart: invoice.billingPeriodStart,
						billingPeriodEnd: invoice.billingPeriodEnd,
						status: invoice.status,
						totalCents: invoice.totalCents,
						currency: invoice.currency,
					createdAt: invoice.createdAt,
					finalizedAt: invoice.finalizedAt,
					memberFirstName: clubMember.firstName,
					memberLastName: clubMember.lastName,
				})
				.from(invoice)
				.innerJoin(clubMember, eq(clubMember.id, invoice.memberId))
				.where(and(...conditions))
				.orderBy(desc(invoice.billingPeriodStart), desc(invoice.createdAt));
		})
		.route({ method: "GET", path: "/billing/invoices" }),

	getInvoice: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["view"] }))
		.input(invoiceIdSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const [invoiceRow] = await db
				.select()
				.from(invoice)
				.where(and(eq(invoice.id, input.id), eq(invoice.organizationId, organizationId)))
				.limit(1);

			if (!invoiceRow) {
				throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
			}

			const lines = await db
				.select()
				.from(invoiceLine)
				.where(eq(invoiceLine.invoiceId, input.id))
				.orderBy(asc(invoiceLine.createdAt));

			const batchItems = await db
				.select({
					id: sepaBatchItem.id,
					sepaBatchId: sepaBatchItem.sepaBatchId,
					status: sepaBatchItem.status,
					amountCents: sepaBatchItem.amountCents,
					batchStatus: sepaBatch.status,
					batchNumber: sepaBatch.batchNumber,
					collectionDate: sepaBatch.collectionDate,
					mandateReference: sepaMandate.mandateReference,
				})
				.from(sepaBatchItem)
				.innerJoin(sepaBatch, eq(sepaBatch.id, sepaBatchItem.sepaBatchId))
				.innerJoin(sepaMandate, eq(sepaMandate.id, sepaBatchItem.sepaMandateId))
				.where(eq(sepaBatchItem.invoiceId, input.id))
				.orderBy(desc(sepaBatch.createdAt));

			return {
				invoice: invoiceRow,
				lines,
				sepaBatchItems: batchItems,
			};
		})
		.route({ method: "GET", path: "/billing/invoices/:id" }),

	voidInvoice: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["generate"] }))
		.input(voidInvoiceSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			await ensureInvoiceNotExported(input.id);
			const updated = await wsDb.transaction(async (tx) => {
				const [invoiceRow] = await tx
					.select({
						id: invoice.id,
						status: invoice.status,
						contractId: invoice.contractId,
						organizationId: invoice.organizationId,
					})
					.from(invoice)
					.where(and(eq(invoice.id, input.id), eq(invoice.organizationId, organizationId)))
					.limit(1);

				if (!invoiceRow) {
					throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
				}

				if (invoiceRow.status === "void") {
					throw new ORPCError("BAD_REQUEST", { message: "Invoice is already void" });
				}

				const lines = await tx
					.select({
						type: invoiceLine.type,
						totalAmountCents: invoiceLine.totalAmountCents,
						creditGrantId: invoiceLine.creditGrantId,
					})
					.from(invoiceLine)
					.where(eq(invoiceLine.invoiceId, input.id));

				const [voided] = await tx
					.update(invoice)
					.set({
						status: "void",
						voidReason: input.reason,
					})
					.where(eq(invoice.id, input.id))
					.returning();

				if (!voided) {
					throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
				}

				if (lines.some((line) => line.type === "joining_fee")) {
					await setJoiningFeePaidState(tx, invoiceRow.contractId, false);
				}

				await restoreCreditGrants(tx, lines);

				return voided;
			});

			return updated;
		})
		.route({ method: "POST", path: "/billing/invoices/:id/void" }),

	replaceInvoice: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["generate"] }))
		.input(replaceInvoiceSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			await ensureInvoiceNotExported(input.id);

			return wsDb.transaction(async (tx) => {
				const [currentInvoice] = await tx
					.select()
					.from(invoice)
					.where(
						and(eq(invoice.id, input.id), eq(invoice.organizationId, organizationId)),
					)
					.limit(1);

				if (!currentInvoice) {
					throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
				}

				if (currentInvoice.status === "void") {
					throw new ORPCError("BAD_REQUEST", { message: "Invoice is already void" });
				}

				const currentLines = await tx
					.select()
					.from(invoiceLine)
					.where(eq(invoiceLine.invoiceId, input.id));

				await tx
					.update(invoice)
					.set({ status: "void", voidReason: input.reason })
					.where(eq(invoice.id, input.id));

				await restoreCreditGrants(tx, currentLines);

				const chargeLines: InvoiceLineDraft[] = currentLines
					.filter((line) => line.type !== "credit_money" && line.type !== "credit_cycle")
					.map((line) => ({
						organizationId,
						type: line.type,
						description: line.description,
						quantity: line.quantity,
						unitAmountCents: line.unitAmountCents,
						totalAmountCents: line.totalAmountCents,
						coverageStart: line.coverageStart,
						coverageEnd: line.coverageEnd,
						groupId: line.groupId,
						creditGrantId: line.creditGrantId,
					}));

				await applyCredits({
					tx,
					organizationId,
					memberId: currentInvoice.memberId,
					contractId: currentInvoice.contractId,
					monthStart: currentInvoice.billingPeriodStart,
					lines: chargeLines,
				});

				const replacement = await createInvoiceWithLines(tx, {
						invoice: {
							organizationId,
							memberId: currentInvoice.memberId,
							contractId: currentInvoice.contractId,
							billingPeriodStart: currentInvoice.billingPeriodStart,
							billingPeriodEnd: currentInvoice.billingPeriodEnd,
							status: "draft",
							currency: currentInvoice.currency,
						},
					lines: chargeLines,
				});

				await tx
					.update(invoice)
					.set({ replacedByInvoiceId: replacement.id })
					.where(eq(invoice.id, currentInvoice.id));

				return replacement;
			});
		})
		.route({ method: "POST", path: "/billing/invoices/:id/replace" }),

	createCreditGrant: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ member: ["update"] }))
		.input(createCreditGrantSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const [created] = await db
				.insert(creditGrant)
				.values({
					organizationId,
					memberId: input.memberId,
					contractId: input.contractId,
					type: input.type,
					originalAmountCents: input.originalAmountCents,
					remainingAmountCents: input.originalAmountCents,
					originalCycles: input.originalCycles,
					remainingCycles: input.originalCycles,
					validFrom: input.validFrom,
					expiresAt: input.expiresAt,
					description: input.description,
					notes: input.notes,
				})
				.returning();

			if (!created) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create credit grant",
				});
			}

			return created;
		})
		.route({ method: "POST", path: "/billing/credit-grants" }),

	listCreditGrants: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ member: ["view_payment"] }))
		.input(listCreditGrantsSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const conditions = [
				eq(creditGrant.organizationId, organizationId),
				input.memberId ? eq(creditGrant.memberId, input.memberId) : undefined,
				input.contractId ? eq(creditGrant.contractId, input.contractId) : undefined,
			].filter(Boolean);

			return db
				.select()
				.from(creditGrant)
				.where(and(...conditions))
				.orderBy(desc(creditGrant.createdAt));
		})
		.route({ method: "GET", path: "/billing/credit-grants" }),

	createSepaMandate: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ sepa: ["update"] }))
		.input(createSepaMandateSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			return wsDb.transaction(async (tx) => {
				await tx
					.update(sepaMandate)
					.set({ isActive: false, revokedAt: new Date() })
					.where(
						and(
							eq(sepaMandate.organizationId, organizationId),
							eq(sepaMandate.contractId, input.contractId),
							eq(sepaMandate.isActive, true),
						),
					);

				const [created] = await tx
					.insert(sepaMandate)
					.values({
						organizationId,
						memberId: input.memberId,
						contractId: input.contractId,
						mandateReference: input.mandateReference,
						accountHolder: input.accountHolder,
						iban: input.iban,
						bic: input.bic,
						signatureDate: input.signatureDate,
						isActive: true,
					})
					.returning();

				if (!created) {
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: "Failed to create mandate",
					});
				}

				return created;
			});
		})
		.route({ method: "POST", path: "/billing/sepa-mandates" }),

	listSepaMandates: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ sepa: ["view"] }))
		.input(listSepaMandatesSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const conditions = [
				eq(sepaMandate.organizationId, organizationId),
				input.memberId ? eq(sepaMandate.memberId, input.memberId) : undefined,
				input.contractId ? eq(sepaMandate.contractId, input.contractId) : undefined,
			].filter(Boolean);

			return db
				.select()
				.from(sepaMandate)
				.where(and(...conditions))
				.orderBy(desc(sepaMandate.createdAt));
		})
		.route({ method: "GET", path: "/billing/sepa-mandates" }),

	revokeSepaMandate: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ sepa: ["update"] }))
		.input(revokeSepaMandateSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const [updated] = await db
				.update(sepaMandate)
				.set({
					isActive: false,
					revokedAt: new Date(),
				})
				.where(
					and(eq(sepaMandate.id, input.id), eq(sepaMandate.organizationId, organizationId)),
				)
				.returning();

			if (!updated) {
				throw new ORPCError("NOT_FOUND", { message: "Mandate not found" });
			}

			return updated;
		})
		.route({ method: "POST", path: "/billing/sepa-mandates/:id/revoke" }),

	listSepaBatches: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["view"] }))
		.input(z.object({}))
		.handler(async ({ context }) => {
			const organizationId = context.session.activeOrganizationId!;
			return db
				.select()
				.from(sepaBatch)
				.where(eq(sepaBatch.organizationId, organizationId))
				.orderBy(desc(sepaBatch.createdAt));
		})
		.route({ method: "GET", path: "/billing/sepa-batches" }),

	previewSepaBatch: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["view"] }))
		.input(previewSepaBatchSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			return listEligibleInvoicesForBatch({
				organizationId,
				collectionDate: input.collectionDate,
			});
		})
		.route({ method: "GET", path: "/billing/sepa-batches/preview" }),

	generateSepaBatch: protectedProcedure
		.use(rateLimitMiddleware(3))
		.use(requirePermission({ billing: ["generate"] }))
		.input(generateSepaBatchSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const preview = await listEligibleInvoicesForBatch({
				organizationId,
				collectionDate: input.collectionDate,
			});

			if (preview.includedInvoices.length === 0) {
				throw new ORPCError("BAD_REQUEST", {
					message: "No eligible invoices for SEPA export",
				});
			}

			const result = await wsDb.transaction(async (tx) => {
				const sequenceNumber = await getNextBatchSequenceNumber(
					tx,
					organizationId,
					input.collectionDate,
				);
				const batchNumber = buildBatchNumber(
					organizationId,
					input.collectionDate,
					sequenceNumber,
				);

				const [createdBatch] = await tx
					.insert(sepaBatch)
					.values({
						organizationId,
						collectionDate: input.collectionDate,
						sequenceNumber,
						batchNumber,
						status: "generated",
						totalAmountCents: preview.includedInvoices.reduce(
							(sum, currentInvoice) => sum + currentInvoice.totalCents,
							0,
						),
						transactionCount: preview.includedInvoices.length,
						notes: input.notes,
					})
					.returning();

				if (!createdBatch) {
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: "Failed to create SEPA batch",
					});
				}

				await tx.insert(sepaBatchItem).values(
					preview.includedInvoices.map((currentInvoice) => ({
						organizationId,
						sepaBatchId: createdBatch.id,
						invoiceId: currentInvoice.id,
						sepaMandateId: currentInvoice.sepaMandateId,
						amountCents: currentInvoice.totalCents,
						status: "included",
					})),
				);

				return createdBatch;
			});

			return {
				batch: result,
				includedInvoices: preview.includedInvoices,
				excludedInvoices: preview.excludedInvoices,
			};
		})
		.route({ method: "POST", path: "/billing/sepa-batches" }),

	getSepaBatch: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["view"] }))
		.input(invoiceIdSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const [batch] = await db
				.select()
				.from(sepaBatch)
				.where(and(eq(sepaBatch.id, input.id), eq(sepaBatch.organizationId, organizationId)))
				.limit(1);

			if (!batch) {
				throw new ORPCError("NOT_FOUND", { message: "SEPA batch not found" });
			}

			const items = await db
				.select({
					id: sepaBatchItem.id,
					invoiceId: sepaBatchItem.invoiceId,
					amountCents: sepaBatchItem.amountCents,
					status: sepaBatchItem.status,
					contractId: invoice.contractId,
					memberFirstName: clubMember.firstName,
					memberLastName: clubMember.lastName,
					billingPeriodStart: invoice.billingPeriodStart,
					billingPeriodEnd: invoice.billingPeriodEnd,
				})
				.from(sepaBatchItem)
				.innerJoin(invoice, eq(invoice.id, sepaBatchItem.invoiceId))
				.innerJoin(clubMember, eq(clubMember.id, invoice.memberId))
				.where(eq(sepaBatchItem.sepaBatchId, input.id))
				.orderBy(asc(clubMember.lastName), asc(clubMember.firstName));

			const activeMandates = await db
				.select({
					contractId: sepaMandate.contractId,
					mandateReference: sepaMandate.mandateReference,
				})
				.from(sepaMandate)
				.where(
					and(
						eq(sepaMandate.organizationId, organizationId),
						eq(sepaMandate.isActive, true),
						isNull(sepaMandate.revokedAt),
						inArray(
							sepaMandate.contractId,
							Array.from(new Set(items.map((item) => item.contractId))),
						),
					),
				);
			const mandateReferenceByContractId = new Map(
				activeMandates.map((mandate) => [
					mandate.contractId,
					mandate.mandateReference,
				]),
			);

			return {
				batch,
				items: items.map((item) => ({
					...item,
					mandateReference:
						mandateReferenceByContractId.get(item.contractId) ?? null,
				})),
			};
		})
		.route({ method: "GET", path: "/billing/sepa-batches/:id" }),

	downloadSepaBatch: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["download"] }))
		.input(markBatchDownloadedSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const { batch, xml } = await buildSepaBatchXml({
				organizationId,
				batchId: input.id,
			});

			let nextBatch = batch;
			if (batch.status === "generated") {
				const [updated] = await db
					.update(sepaBatch)
					.set({ status: "downloaded" })
					.where(
						and(
							eq(sepaBatch.id, input.id),
							eq(sepaBatch.organizationId, organizationId),
							eq(sepaBatch.status, "generated"),
						),
					)
					.returning();

				if (updated) {
					nextBatch = updated;
				}
			}

			return {
				batch: nextBatch,
				xml,
			};
		})
		.route({ method: "POST", path: "/billing/sepa-batches/:id/download" }),

	markSepaBatchDownloaded: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["download"] }))
		.input(markBatchDownloadedSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const [updated] = await db
				.update(sepaBatch)
				.set({ status: "downloaded" })
				.where(
					and(
						eq(sepaBatch.id, input.id),
						eq(sepaBatch.organizationId, organizationId),
						eq(sepaBatch.status, "generated"),
					),
				)
				.returning();

			if (!updated) {
				throw new ORPCError("NOT_FOUND", { message: "SEPA batch not found" });
			}

			return updated;
		})
		.route({ method: "POST", path: "/billing/sepa-batches/:id/downloaded" }),

	voidSepaBatch: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["generate"] }))
		.input(updateBatchStatusSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const [updated] = await db
				.update(sepaBatch)
				.set({ status: "void" })
				.where(
					and(
						eq(sepaBatch.id, input.id),
						eq(sepaBatch.organizationId, organizationId),
						or(eq(sepaBatch.status, "generated"), eq(sepaBatch.status, "downloaded")),
					),
				)
				.returning();

			if (!updated) {
				throw new ORPCError("NOT_FOUND", { message: "SEPA batch not found or already void/superseded" });
			}

			return updated;
		})
		.route({ method: "POST", path: "/billing/sepa-batches/:id/void" }),

	supersedeSepaBatch: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ billing: ["generate"] }))
		.input(updateBatchStatusSchema)
		.handler(async ({ input, context }) => {
			const organizationId = context.session.activeOrganizationId!;
			const [updated] = await db
				.update(sepaBatch)
				.set({ status: "superseded" })
				.where(
					and(
						eq(sepaBatch.id, input.id),
						eq(sepaBatch.organizationId, organizationId),
						eq(sepaBatch.status, "downloaded"),
					),
				)
				.returning();

			if (!updated) {
				throw new ORPCError("NOT_FOUND", { message: "SEPA batch not found or not in downloaded state" });
			}

			return updated;
		})
		.route({ method: "POST", path: "/billing/sepa-batches/:id/supersede" }),
};

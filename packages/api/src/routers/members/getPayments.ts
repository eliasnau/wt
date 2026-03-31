import { ORPCError } from "@orpc/server";
import { and, db, desc, eq, inArray, sql } from "@repo/db";
import {
	clubMember,
	contract,
	invoice,
	sepaBatch,
	sepaBatchItem,
} from "@repo/db/schema";

export async function getMemberPayments({
	organizationId,
	memberId,
}: {
	organizationId: string;
	memberId: string;
}) {
	const member = await db.query.clubMember.findFirst({
		where: and(
			eq(clubMember.id, memberId),
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
			id: invoice.id,
			status: invoice.status,
			totalCents: invoice.totalCents,
			billingPeriodStart: invoice.billingPeriodStart,
			billingPeriodEnd: invoice.billingPeriodEnd,
			createdAt: invoice.createdAt,
		})
		.from(invoice)
		.innerJoin(contract, eq(invoice.contractId, contract.id))
		.where(
			and(
				eq(contract.memberId, memberId),
				eq(contract.organizationId, organizationId),
				eq(invoice.organizationId, organizationId),
			),
		)
		.orderBy(desc(invoice.billingPeriodStart), desc(invoice.createdAt));

	const batchInfoByInvoiceId = new Map<
		string,
		{
			batchId: string;
			batchNumber: string;
			collectionDate: string;
		}
	>();

	if (payments.length > 0) {
		const batchRows = await db
			.select({
				invoiceId: sepaBatchItem.invoiceId,
				batchId: sepaBatch.id,
				batchNumber: sepaBatch.batchNumber,
				collectionDate: sepaBatch.collectionDate,
			})
			.from(sepaBatchItem)
			.innerJoin(sepaBatch, eq(sepaBatch.id, sepaBatchItem.sepaBatchId))
			.where(
				and(
					eq(sepaBatchItem.organizationId, organizationId),
					inArray(
						sepaBatchItem.invoiceId,
						payments.map((payment) => payment.id),
					),
					sql`${sepaBatchItem.status} <> 'void'`,
					sql`${sepaBatch.status} <> 'void'`,
				),
			)
			.orderBy(desc(sepaBatch.createdAt));

		for (const batchRow of batchRows) {
			if (!batchInfoByInvoiceId.has(batchRow.invoiceId)) {
				batchInfoByInvoiceId.set(batchRow.invoiceId, {
					batchId: batchRow.batchId,
					batchNumber: batchRow.batchNumber,
					collectionDate: batchRow.collectionDate,
				});
			}
		}
	}

	return {
		memberId,
		payments: payments.map((payment) => ({
			...payment,
			batchId: batchInfoByInvoiceId.get(payment.id)?.batchId ?? null,
			batchNumber: batchInfoByInvoiceId.get(payment.id)?.batchNumber ?? null,
			collectionDate:
				batchInfoByInvoiceId.get(payment.id)?.collectionDate ?? null,
		})),
	};
}

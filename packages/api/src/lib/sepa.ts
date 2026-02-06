/// <reference path="../types/sepa.d.ts" />
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import type { InferSelectModel } from "@repo/db";
import type { organizationSettings } from "@repo/db/schema";

export const sepaSettingsSchema = z.object({
	creditorName: z.string().min(1).max(140).optional(),
	creditorIban: z.string().min(1).max(34).optional(),
	creditorBic: z.string().min(1).max(11).optional(),
	creditorId: z.string().min(1).max(35).optional(),
	initiatorName: z.string().min(1).max(140).optional(),
	batchBooking: z.boolean().optional(),
	remittanceTemplates: z
		.object({
			membership: z.string().max(140).optional(),
			joiningFee: z.string().max(140).optional(),
			yearlyFee: z.string().max(140).optional(),
		})
		.optional(),
});

export type SepaSettings = z.infer<typeof sepaSettingsSchema>;
export type SepaSettingsRequiredCore = SepaSettings & {
	creditorName: string;
	creditorIban: string;
	creditorBic: string;
	creditorId: string;
};

export type OrganizationSettingsRow = InferSelectModel<
	typeof organizationSettings
>;

export function mapSepaRowToSettings(
	row: OrganizationSettingsRow,
): SepaSettings {
	return {
		creditorName: row.creditorName ?? undefined,
		creditorIban: row.creditorIban ?? undefined,
		creditorBic: row.creditorBic ?? undefined,
		creditorId: row.creditorId ?? undefined,
		initiatorName: row.initiatorName ?? undefined,
		batchBooking: row.batchBooking ?? undefined,
		remittanceTemplates: {
			membership: row.remittanceMembership ?? undefined,
			joiningFee: row.remittanceJoiningFee ?? undefined,
			yearlyFee: row.remittanceYearlyFee ?? undefined,
		},
	};
}

export function requireSepaSettings(
	row: OrganizationSettingsRow | null | undefined,
): SepaSettingsRequiredCore {
	if (!row) {
		throw new ORPCError("BAD_REQUEST", {
			message:
				"SEPA settings are not configured. Visit Settings > SEPA to add creditor details.",
		});
	}
	const settings = mapSepaRowToSettings(row);
	if (
		!settings.creditorName ||
		!settings.creditorIban ||
		!settings.creditorBic ||
		!settings.creditorId
	) {
		throw new ORPCError("BAD_REQUEST", {
			message:
				"SEPA settings are incomplete. Visit Settings > SEPA to add creditor details.",
		});
	}

	return settings as SepaSettingsRequiredCore;
}

export type SepaPaymentInfo = {
	collectionDate?: Date;
	creditorIBAN?: string;
	creditorBIC?: string;
	creditorName?: string;
	creditorId?: string;
	batchBooking?: boolean;
	addTransaction: (tx: SepaTransaction) => void;
	createTransaction: () => SepaTransaction;
};

export type SepaTransaction = {
	debtorName?: string;
	debtorIBAN?: string;
	debtorBIC?: string;
	mandateId?: string;
	mandateSignatureDate?: Date;
	amount?: number;
	currency?: string;
	remittanceInfo?: string;
	end2endId?: string;
};

export type SepaDocument = {
	grpHdr: {
		id: string;
		created: Date;
		initiatorName: string;
	};
	addPaymentInfo: (info: SepaPaymentInfo) => void;
	createPaymentInfo: () => SepaPaymentInfo;
	toString: () => string;
};

export type SepaModule = {
	Document: new (format?: string) => SepaDocument;
	validateIBAN: (iban: string) => boolean;
	validateCreditorID: (creditorId: string) => boolean;
};

export async function loadSepaModule(): Promise<SepaModule> {
	const sepaModule = await import("sepa");
	return (sepaModule as any).default ?? sepaModule;
}

export function validateCreditorDetails(
	sepa: SepaModule,
	settings: SepaSettingsRequiredCore,
): void {
	if (!sepa.validateIBAN(settings.creditorIban)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid creditor IBAN",
		});
	}

	if (!sepa.validateCreditorID(settings.creditorId)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid creditor ID",
		});
	}

	const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
	if (!bicRegex.test(settings.creditorBic)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid creditor BIC",
		});
	}
}

export function validateCreditorDetailsIfPresent(
	sepa: SepaModule,
	settings: SepaSettings,
): void {
	if (settings.creditorIban && !sepa.validateIBAN(settings.creditorIban)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid creditor IBAN",
		});
	}

	if (settings.creditorId && !sepa.validateCreditorID(settings.creditorId)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid creditor ID",
		});
	}

	const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
	if (settings.creditorBic && !bicRegex.test(settings.creditorBic)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invalid creditor BIC",
		});
	}
}

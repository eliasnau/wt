/**
 * Billing utility functions for the new invoice-based billing system.
 * All amounts are stored as integer cents in the backend.
 */

/**
 * Format cents to currency display string
 */
export function formatCents(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency,
	}).format(cents / 100);
}

/**
 * Format a date string (YYYY-MM-DD) to localized display
 */
export function formatBillingDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "-";
	const [year, month, day] = dateStr.split("-").map(Number);
	if (!year || !month || !day) return "-";
	return new Date(year, month - 1, day).toLocaleDateString("de-DE", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

/**
 * Format a date string (YYYY-MM-DD) to short format
 */
export function formatBillingDateShort(
	dateStr: string | null | undefined,
): string {
	if (!dateStr) return "-";
	const [year, month, day] = dateStr.split("-").map(Number);
	if (!year || !month || !day) return "-";
	return new Date(year, month - 1, day).toLocaleDateString("de-DE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

/**
 * Format billing period (start - end)
 */
export function formatBillingPeriod(
	start: string | null | undefined,
	end: string | null | undefined,
): string {
	if (!start || !end) return "-";
	const [startYear, startMonth] = start.split("-").map(Number);
	const [endYear, endMonth] = end.split("-").map(Number);
	if (!startYear || !startMonth || !endYear || !endMonth) return "-";

	const startDate = new Date(startYear, startMonth - 1, 1);
	const endDate = new Date(endYear, endMonth - 1, 1);

	// If same month, just show the month
	if (startYear === endYear && startMonth === endMonth) {
		return startDate.toLocaleDateString("de-DE", {
			year: "numeric",
			month: "long",
		});
	}

	// Show range
	return `${startDate.toLocaleDateString("de-DE", { month: "short", year: "numeric" })} - ${endDate.toLocaleDateString("de-DE", { month: "short", year: "numeric" })}`;
}

/**
 * Get month label from date string
 */
export function getMonthLabel(dateStr: string): string {
	const [year, month] = dateStr.split("-").map(Number);
	if (!year || !month) return dateStr;
	return new Date(year, month - 1, 1).toLocaleDateString("de-DE", {
		month: "long",
		year: "numeric",
	});
}

/**
 * Invoice status types
 */
export type InvoiceStatus = "draft" | "finalized" | "void";

/**
 * Get badge variant for invoice status
 */
export function getInvoiceStatusVariant(
	status: InvoiceStatus,
): "default" | "info" | "success" | "warning" | "error" | "outline" {
	switch (status) {
		case "draft":
			return "warning";
		case "finalized":
			return "success";
		case "void":
			return "error";
		default:
			return "outline";
	}
}

/**
 * Get display label for invoice status
 */
export function getInvoiceStatusLabel(status: InvoiceStatus): string {
	switch (status) {
		case "draft":
			return "Entwurf";
		case "finalized":
			return "Finalisiert";
		case "void":
			return "Storniert";
		default:
			return status;
	}
}

/**
 * SEPA batch status types
 */
export type SepaBatchStatus = "generated" | "downloaded" | "void" | "superseded";

/**
 * Get badge variant for SEPA batch status
 */
export function getSepaBatchStatusVariant(
	status: SepaBatchStatus,
): "default" | "info" | "success" | "warning" | "error" | "outline" {
	switch (status) {
		case "generated":
			return "info";
		case "downloaded":
			return "success";
		case "void":
			return "error";
		case "superseded":
			return "warning";
		default:
			return "outline";
	}
}

/**
 * Get display label for SEPA batch status
 */
export function getSepaBatchStatusLabel(status: SepaBatchStatus): string {
	switch (status) {
		case "generated":
			return "Generiert";
		case "downloaded":
			return "Heruntergeladen";
		case "void":
			return "Storniert";
		case "superseded":
			return "Ersetzt";
		default:
			return status;
	}
}

/**
 * Contract status types
 */
export type ContractStatus = "active" | "cancelled" | "ended";

/**
 * Get badge variant for contract status
 */
export function getContractStatusVariant(
	status: ContractStatus,
): "default" | "info" | "success" | "warning" | "error" | "outline" {
	switch (status) {
		case "active":
			return "success";
		case "cancelled":
			return "warning";
		case "ended":
			return "error";
		default:
			return "outline";
	}
}

/**
 * Get display label for contract status
 */
export function getContractStatusLabel(status: ContractStatus): string {
	switch (status) {
		case "active":
			return "Aktiv";
		case "cancelled":
			return "Gekündigt";
		case "ended":
			return "Beendet";
		default:
			return status;
	}
}

/**
 * Invoice line type
 */
export type InvoiceLineType =
	| "membership_fee"
	| "joining_fee"
	| "yearly_fee"
	| "credit_money"
	| "credit_cycle"
	| "manual_adjustment"
	| "arrears"
	| "waiver";

/**
 * Get display label for invoice line type
 */
export function getInvoiceLineTypeLabel(type: InvoiceLineType | string): string {
	switch (type) {
		case "membership_fee":
			return "Mitgliedsbeitrag";
		case "joining_fee":
			return "Aufnahmegebühr";
		case "yearly_fee":
			return "Jahresbeitrag";
		case "credit_money":
			return "Guthaben";
		case "credit_cycle":
			return "Freier Monat";
		case "manual_adjustment":
			return "Manuelle Anpassung";
		case "arrears":
			return "Rückstand";
		case "waiver":
			return "Verzicht";
		default:
			return type;
	}
}

/**
 * Get badge variant for invoice line type
 */
export function getInvoiceLineTypeVariant(
	type: InvoiceLineType | string,
): "default" | "info" | "success" | "warning" | "error" | "outline" {
	switch (type) {
		case "membership_fee":
			return "default";
		case "joining_fee":
			return "info";
		case "yearly_fee":
			return "info";
		case "credit_money":
		case "credit_cycle":
			return "success";
		case "arrears":
			return "warning";
		case "waiver":
			return "outline";
		case "manual_adjustment":
			return "outline";
		default:
			return "outline";
	}
}

/**
 * Credit grant type
 */
export type CreditGrantType = "money" | "billing_cycles";

/**
 * Get display label for credit grant type
 */
export function getCreditGrantTypeLabel(type: CreditGrantType): string {
	switch (type) {
		case "money":
			return "Guthaben";
		case "billing_cycles":
			return "Freie Monate";
		default:
			return type;
	}
}

/**
 * Initial period types
 */
export type InitialPeriod = "monthly" | "half_yearly" | "yearly";

/**
 * Get display label for initial period
 */
export function getInitialPeriodLabel(period: InitialPeriod | string): string {
	switch (period) {
		case "monthly":
			return "Monatlich";
		case "half_yearly":
			return "Halbjährlich";
		case "yearly":
			return "Jährlich";
		default:
			return period;
	}
}

/**
 * Exclusion reasons for SEPA batch preview
 */
export type ExclusionReason =
	| "already_exported"
	| "missing_active_mandate"
	| "total_is_zero"
	| "invalid_creditor_settings"
	| "invoice_not_finalized"
	| "batch_conflict";

/**
 * Get display label for exclusion reason
 */
export function getExclusionReasonLabel(reason: ExclusionReason | string): string {
	switch (reason) {
		case "already_exported":
			return "Bereits exportiert";
		case "missing_active_mandate":
			return "Kein aktives SEPA-Mandat";
		case "total_is_zero":
			return "Betrag ist 0";
		case "invalid_creditor_settings":
			return "Ungültige Gläubiger-Einstellungen";
		case "invoice_not_finalized":
			return "Rechnung nicht finalisiert";
		case "batch_conflict":
			return "Batch-Konflikt";
		default:
			return reason;
	}
}

/**
 * Get badge variant for exclusion reason
 */
export function getExclusionReasonVariant(
	reason: ExclusionReason | string,
): "default" | "info" | "success" | "warning" | "error" | "outline" {
	switch (reason) {
		case "already_exported":
			return "info";
		case "missing_active_mandate":
			return "error";
		case "total_is_zero":
			return "outline";
		case "invalid_creditor_settings":
			return "error";
		case "invoice_not_finalized":
			return "warning";
		case "batch_conflict":
			return "error";
		default:
			return "outline";
	}
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Get first day of current month in YYYY-MM-01 format
 */
export function getCurrentMonthStart(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Get first day of next month in YYYY-MM-01 format
 */
export function getNextMonthStart(): string {
	const now = new Date();
	const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
}

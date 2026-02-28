import type { ListMembersAdvancedRecord } from "./listMembersAdvanced";

const MEMBERS_EXPORT_COLUMNS = [
	"memberId",
	"firstName",
	"lastName",
	"fullName",
	"email",
	"phone",
	"membershipStatus",
	"contractStartDate",
	"cancellationEffectiveDate",
	"cancelledAt",
	"initialPeriod",
	"city",
	"postalCode",
	"country",
	"groups",
	"createdAt",
	"updatedAt",
] as const;

type MembersExportColumn = (typeof MEMBERS_EXPORT_COLUMNS)[number];

function toCsvDateValue(value: Date | string | null | undefined): string {
	if (!value) {
		return "";
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	return value;
}

function toCsvValue(value: string | null | undefined): string {
	return value ?? "";
}

function escapeCsvField(value: string): string {
	if (/[",\r\n]/.test(value)) {
		return `"${value.replace(/"/g, "\"\"")}"`;
	}

	return value;
}

function getCsvRowValues(row: ListMembersAdvancedRecord): Record<MembersExportColumn, string> {
	const fullName = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
	const groups = (row.groupMembers ?? [])
		.map((groupMember) => groupMember.group?.name?.trim() ?? "")
		.filter((name) => name.length > 0)
		.join("; ");

	return {
		memberId: row.id,
		firstName: toCsvValue(row.firstName),
		lastName: toCsvValue(row.lastName),
		fullName,
		email: toCsvValue(row.email),
		phone: toCsvValue(row.phone),
		membershipStatus: row.membershipStatus,
		contractStartDate: toCsvDateValue(row.contract?.startDate),
		cancellationEffectiveDate: toCsvDateValue(
			row.contract?.cancellationEffectiveDate,
		),
		cancelledAt: toCsvDateValue(row.contract?.cancelledAt),
		initialPeriod: toCsvValue(row.contract?.initialPeriod),
		city: toCsvValue(row.city),
		postalCode: toCsvValue(row.postalCode),
		country: toCsvValue(row.country),
		groups,
		createdAt: toCsvDateValue(row.createdAt),
		updatedAt: toCsvDateValue(row.updatedAt),
	};
}

export function serializeMembersCsv(rows: ListMembersAdvancedRecord[]): string {
	const headerRow = MEMBERS_EXPORT_COLUMNS.join(",");
	const dataRows = rows.map((row) => {
		const values = getCsvRowValues(row);
		return MEMBERS_EXPORT_COLUMNS.map((column) =>
			escapeCsvField(values[column]),
		).join(",");
	});

	return [headerRow, ...dataRows].join("\r\n");
}

export function buildMembersExportFilename(now: Date = new Date()): string {
	const date = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Berlin",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(now);

	return `members-export-${date}.csv`;
}

import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { DB } from "@repo/db/functions";
import { z } from "zod";
import { geocodeAddress } from "../../lib/geocoding";
import { loadSepaModule } from "../../lib/sepa";

export const optionalEmailSchema = z
	.string()
	.trim()
	.email("Invalid email address")
	.or(z.string().trim().length(0));

export const optionalPhoneSchema = z
	.string()
	.trim()
	.max(255, "Phone is too long");

function isLastDayOfMonthDate(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return false;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (!year || month < 1 || month > 12 || day < 1) return false;

	const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
	return day === lastDay;
}

export const createMemberSchema = z.object({
	firstName: z.string().min(1, "First name is required").max(255),
	lastName: z.string().min(1, "Last name is required").max(255),
	birthdate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)")
		.optional()
		.or(z.literal("")),
	email: optionalEmailSchema,
	phone: optionalPhoneSchema,
	street: z.string().min(1, "Street is required"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
	iban: z.string().min(1, "IBAN is required"),
	bic: z.string().min(1, "BIC is required"),
	cardHolder: z.string().min(1, "Card holder name is required"),
	contractStartDate: z
		.string()
		.regex(/^\d{4}-\d{2}-01$/, "Must be 1st day of month (YYYY-MM-01)"),
	initialPeriod: z.enum(["monthly", "half_yearly", "yearly"]),
	joiningFeeCents: z.number().int().nonnegative().optional(),
	yearlyFeeCents: z.number().int().nonnegative().optional(),
	yearlyFeeMode: z.enum(["january", "anniversary"]).optional(),
	settledThroughDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)")
		.refine(isLastDayOfMonthDate, "Must be the last day of the month")
		.optional()
		.or(z.literal("")),
	memberNotes: z.string().max(1000).optional(),
	contractNotes: z.string().max(1000).optional(),
	guardianName: z.string().optional(),
	guardianEmail: z.string().email().optional().or(z.literal("")),
	guardianPhone: z.string().optional(),
});

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

function addMonthsToDate(startDate: string, months: number): string {
	const [year, month] = startDate.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1 + months, 1));
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function calculateInitialPeriodEndDate(
	startDate: string,
	period: "monthly" | "half_yearly" | "yearly",
) {
	const monthCount =
		period === "monthly" ? 1 : period === "half_yearly" ? 6 : 12;
	const nextStartDate = addMonthsToDate(startDate, monthCount);
	const [year, month] = nextStartDate.split("-").map(Number);
	const endDate = new Date(Date.UTC(year, month - 1, 0));
	return `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, "0")}-${String(endDate.getUTCDate()).padStart(2, "0")}`;
}

function generateMandateId(): string {
	return `WT-${randomBytes(12).toString("hex").toUpperCase()}`;
}

function normalizeOptionalText(
	value: string | null | undefined,
): string | undefined {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}

export async function createMemberWithContract({
	organizationId,
	input,
}: {
	organizationId: string;
	input: z.infer<typeof createMemberSchema>;
}) {
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

	const initialPeriodEndDate = calculateInitialPeriodEndDate(
		input.contractStartDate,
		input.initialPeriod,
	);
	const mandateSignatureDate = getTodayInBerlinDateString();
	const geocodedAddress = await geocodeAddress({
		street: input.street,
		postalCode: input.postalCode,
		city: input.city,
		country: input.country,
	});

	return DB.mutation.members.createMemberWithContract({
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
			latitude: geocodedAddress?.latitude ?? null,
			longitude: geocodedAddress?.longitude ?? null,
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
			joiningFeeCents: input.joiningFeeCents,
			yearlyFeeCents: input.yearlyFeeCents,
			yearlyFeeMode: input.yearlyFeeMode ?? "january",
			settledThroughDate:
				normalizeOptionalText(input.settledThroughDate) ?? undefined,
			notes: input.contractNotes,
		},
		sepaMandateData: {
			mandateReference: generateMandateId(),
			signatureDate: mandateSignatureDate,
			accountHolder: input.cardHolder,
			iban: input.iban,
			bic: input.bic,
		},
	});
}

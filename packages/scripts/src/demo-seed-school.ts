import { createHash, randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

type GroupTemplate = {
	name: "Erwachsene" | "Teens" | "Kids";
	color: string;
	defaultPrice: number;
};

type TargetGroup = GroupTemplate["name"];

type SeededContract = {
	contractId: string;
	memberId: string;
	monthlyMembershipAmount: number;
	contractStartDate: string;
	cancellationEffectiveDate: string | null;
	joiningFeeAmount: string | null;
	yearlyFeeAmount: string | null;
};

type Args = {
	orgId: string;
	memberCount: number;
	dryRun: boolean;
};

const GROUPS: GroupTemplate[] = [
	{ name: "Erwachsene", color: "#0E7490", defaultPrice: 49 },
	{ name: "Teens", color: "#2563EB", defaultPrice: 39 },
	{ name: "Kids", color: "#16A34A", defaultPrice: 29 },
];

const FIRST_NAMES_FEMALE = [
	"Anna",
	"Lena",
	"Mia",
	"Emma",
	"Lea",
	"Sophie",
	"Johanna",
	"Clara",
	"Nina",
	"Laura",
	"Paula",
	"Hannah",
];

const FIRST_NAMES_MALE = [
	"Lukas",
	"Jonas",
	"Leon",
	"Paul",
	"Felix",
	"Noah",
	"Max",
	"Tim",
	"Ben",
	"Julian",
	"David",
	"Moritz",
];

const LAST_NAMES = [
	"Mueller",
	"Schmidt",
	"Schneider",
	"Fischer",
	"Weber",
	"Meyer",
	"Wagner",
	"Becker",
	"Hoffmann",
	"Schaefer",
	"Koch",
	"Richter",
	"Klein",
	"Wolf",
	"Schroeder",
	"Neumann",
];

const STREETS = [
	"Hauptstrasse",
	"Schulweg",
	"Bergstrasse",
	"Bahnhofstrasse",
	"Goethestrasse",
	"Lindenweg",
	"Gartenstrasse",
	"Kirchplatz",
];

const CITIES = [
	"Hamburg",
	"Berlin",
	"Koeln",
	"Muenchen",
	"Leipzig",
	"Dortmund",
	"Dresden",
	"Bremen",
];

const BICS = ["GENODEF1N02", "COBADEFFXXX", "BYLADEM1001", "PBNKDEFFXXX"];

const CANCEL_REASONS = [
	"Umzug",
	"Zeitmangel",
	"Berufliche Gruende",
	"Studium",
	"Verletzungspause",
];

function loadEnvForScripts(): void {
	loadDotenv({ quiet: true });
	loadDotenv({ path: resolve(process.cwd(), ".env"), quiet: true });
	loadDotenv({ path: resolve(process.cwd(), "apps/web/.env"), quiet: true });
	loadDotenv({
		path: resolve(process.cwd(), "../../apps/web/.env"),
		quiet: true,
	});
}

function parseArgs(argv: string[]): Args {
	const map = new Map<string, string>();
	const flags = new Set<string>();

	for (let i = 0; i < argv.length; i += 1) {
		const current = argv[i];
		const next = argv[i + 1];
		if (!current || !current.startsWith("--")) {
			continue;
		}

		if (!next || next.startsWith("--")) {
			flags.add(current);
			continue;
		}

		map.set(current, next);
		i += 1;
	}

	const orgId = map.get("--orgId") ?? map.get("--organization-id");
	if (!orgId) {
		throw new Error(
			"Usage: pnpm -F @repo/scripts demo:seed-school -- --orgId <org-id> [--memberCount 75] [--dry-run]",
		);
	}

	const countRaw = map.get("--memberCount") ?? "75";
	const memberCount = Number.parseInt(countRaw, 10);
	if (!Number.isFinite(memberCount) || memberCount < 1 || memberCount > 1000) {
		throw new Error("--memberCount must be a number between 1 and 1000");
	}

	return {
		orgId,
		memberCount,
		dryRun: flags.has("--dry-run"),
	};
}

function hashSeed(input: string): number {
	const hash = createHash("sha256").update(input).digest("hex").slice(0, 8);
	return Number.parseInt(hash, 16) >>> 0;
}

function createRng(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

function randomInt(rng: () => number, min: number, max: number): number {
	return Math.floor(rng() * (max - min + 1)) + min;
}

function pickOne<T>(rng: () => number, values: T[]): T {
	const index = randomInt(rng, 0, values.length - 1);
	const value = values[index];
	if (value === undefined) {
		throw new Error("Cannot pick from empty collection");
	}
	return value;
}

function pad2(value: number): string {
	return String(value).padStart(2, "0");
}

function toDateString(date: Date): string {
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth() + 1;
	const day = date.getUTCDate();
	return `${year}-${pad2(month)}-${pad2(day)}`;
}

function firstDayOfMonth(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function addMonths(date: Date, months: number): Date {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
	);
}

function monthsBetweenInclusive(startMonth: Date, endMonth: Date): Date[] {
	const result: Date[] = [];
	let cursor = firstDayOfMonth(startMonth);
	const end = firstDayOfMonth(endMonth);

	while (cursor.getTime() <= end.getTime()) {
		result.push(cursor);
		cursor = addMonths(cursor, 1);
	}

	return result;
}

function randomBirthdateForGroup(
	rng: () => number,
	group: TargetGroup,
): string {
	const currentYear = new Date().getUTCFullYear();
	const birthYear =
		group === "Kids"
			? randomInt(rng, currentYear - 12, currentYear - 7)
			: group === "Teens"
				? randomInt(rng, currentYear - 17, currentYear - 13)
				: randomInt(rng, currentYear - 60, currentYear - 18);
	const month = randomInt(rng, 1, 12);
	const day = randomInt(rng, 1, 28);
	return `${birthYear}-${pad2(month)}-${pad2(day)}`;
}

function buildIban(rng: () => number): string {
	const bankCode = String(randomInt(rng, 10000000, 99999999));
	const account = String(randomInt(rng, 1000000000, 9999999999));
	const check = String(randomInt(rng, 10, 98));
	return `DE${check}${bankCode}${account}`;
}

function buildPhone(rng: () => number): string {
	const suffix = String(randomInt(rng, 1000000, 9999999));
	return `+4917${randomInt(rng, 0, 9)}${suffix}`;
}

function chooseGroup(rng: () => number): TargetGroup {
	const roll = rng();
	if (roll < 0.38) {
		return "Kids";
	}
	if (roll < 0.68) {
		return "Teens";
	}
	return "Erwachsene";
}

function toDecimalString(amount: number): string {
	return amount.toFixed(2);
}

function generateMandateId(): string {
	return `WT-${randomBytes(12).toString("hex").toUpperCase()}`;
}

function dateAtNoonUtc(date: Date): Date {
	return new Date(
		Date.UTC(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			12,
			0,
			0,
			0,
		),
	);
}

function labelMonth(date: Date): string {
	return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

async function run(): Promise<void> {
	loadEnvForScripts();
	const args = parseArgs(process.argv.slice(2));
	const rng = createRng(hashSeed(`school-seed:${args.orgId}`));

	const { and, db, eq, inArray, lte, wsDb } = await import("@repo/db");
	const {
		clubMember,
		contract,
		group,
		groupMember,
		organization,
		payment,
		paymentBatch,
	} = await import("@repo/db/schema");

	const [org] = await db
		.select({ id: organization.id })
		.from(organization)
		.where(eq(organization.id, args.orgId))
		.limit(1);

	if (!org) {
		throw new Error(`Organization not found: ${args.orgId}`);
	}

	const existingGroups = await db
		.select({ id: group.id, name: group.name })
		.from(group)
		.where(eq(group.organizationId, args.orgId));

	const groupsByName = new Map(
		existingGroups.map((item) => [item.name, item.id]),
	);
	const createdGroupNames: string[] = [];

	if (!args.dryRun) {
		for (const template of GROUPS) {
			if (groupsByName.has(template.name)) {
				continue;
			}

			const inserted = await wsDb
				.insert(group)
				.values({
					organizationId: args.orgId,
					name: template.name,
					color: template.color,
					defaultMembershipPrice: template.defaultPrice,
				})
				.returning({ id: group.id });

			const insertedGroup = inserted[0];
			if (!insertedGroup) {
				throw new Error(`Failed to create group ${template.name}`);
			}

			groupsByName.set(template.name, insertedGroup.id);
			createdGroupNames.push(template.name);
		}
	} else {
		for (const template of GROUPS) {
			if (!groupsByName.has(template.name)) {
				createdGroupNames.push(template.name);
				groupsByName.set(template.name, `dry-run-${template.name}`);
			}
		}
	}

	const seededContracts: SeededContract[] = [];
	const today = new Date();
	const currentMonth = firstDayOfMonth(today);
	const oldestStartMonth = addMonths(currentMonth, -24);
	const lastCompletedMonth = addMonths(currentMonth, -1);

	let createdMembers = 0;
	let endedContracts = 0;
	let futureCancelledContracts = 0;

	for (let i = 0; i < args.memberCount; i += 1) {
		const groupName = chooseGroup(rng);
		const groupTemplate = GROUPS.find((entry) => entry.name === groupName);
		if (!groupTemplate) {
			throw new Error(`Unknown group ${groupName}`);
		}

		const firstNameSource =
			rng() < 0.52 ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
		const firstName = pickOne(rng, firstNameSource);
		const lastName = pickOne(rng, LAST_NAMES);
		const uniqueSuffix = 1000 + i;
		const email =
			`${firstName}.${lastName}${uniqueSuffix}@beispielschule.de`.toLowerCase();

		const street = `${pickOne(rng, STREETS)} ${randomInt(rng, 1, 78)}`;
		const postalCode = String(randomInt(rng, 10000, 99999));
		const city = pickOne(rng, CITIES);

		const startOffsetMonths = randomInt(rng, 1, 24);
		const contractStart = addMonths(currentMonth, -startOffsetMonths);
		if (contractStart.getTime() < oldestStartMonth.getTime()) {
			throw new Error(
				"Generated contract start before configured history window",
			);
		}

		const statusRoll = rng();
		const willEndInPast = statusRoll < 0.24;
		const cancelledButActive = statusRoll >= 0.24 && statusRoll < 0.42;

		const initialPeriod =
			rng() < 0.58 ? "monthly" : rng() < 0.84 ? "half_yearly" : "yearly";
		const initialMonths =
			initialPeriod === "monthly"
				? 1
				: initialPeriod === "half_yearly"
					? 6
					: 12;
		const initialPeriodEndDate = toDateString(
			endOfMonth(addMonths(contractStart, initialMonths - 1)),
		);

		const cancellationRequestedAt = dateAtNoonUtc(
			addMonths(contractStart, randomInt(rng, 5, 30)),
		);
		const cancellationEffectiveDate =
			willEndInPast || cancelledButActive
				? toDateString(
						endOfMonth(
							willEndInPast
								? addMonths(currentMonth, -randomInt(rng, 1, 12))
								: addMonths(currentMonth, randomInt(rng, 1, 6)),
						),
					)
				: null;

		const currentPeriodEndDate =
			willEndInPast && cancellationEffectiveDate
				? cancellationEffectiveDate
				: toDateString(
						endOfMonth(addMonths(currentMonth, randomInt(rng, 0, 2))),
					);

		const nextBillingDate = willEndInPast
			? (cancellationEffectiveDate ?? toDateString(currentMonth))
			: toDateString(addMonths(currentMonth, 1));

		const joiningFeeAmount =
			rng() < 0.7 ? toDecimalString(randomInt(rng, 15, 40)) : null;
		const yearlyFeeAmount =
			rng() < 0.35 ? toDecimalString(randomInt(rng, 25, 80)) : null;

		const monthlyMembershipAmount = Math.max(
			19,
			groupTemplate.defaultPrice + randomInt(rng, -5, 6),
		);

		const memberNotesParts = [
			"DEMO_SEED:SCHOOL_HISTORY",
			`SEGMENT:${groupName.toUpperCase()}`,
			willEndInPast
				? "STATUS:CANCELLED"
				: cancelledButActive
					? "STATUS:CANCELLED_BUT_ACTIVE"
					: "STATUS:ACTIVE",
		];

		if (args.dryRun) {
			createdMembers += 1;
			if (willEndInPast) {
				endedContracts += 1;
			}
			if (cancelledButActive) {
				futureCancelledContracts += 1;
			}

			seededContracts.push({
				contractId: `dry-run-contract-${i}`,
				memberId: `dry-run-member-${i}`,
				monthlyMembershipAmount,
				contractStartDate: toDateString(contractStart),
				cancellationEffectiveDate,
				joiningFeeAmount,
				yearlyFeeAmount,
			});
			continue;
		}

		const targetGroupId = groupsByName.get(groupName);
		if (!targetGroupId) {
			throw new Error(`Group ${groupName} is not available`);
		}

		await wsDb.transaction(async (tx) => {
			const insertedMemberRows = await tx
				.insert(clubMember)
				.values({
					organizationId: args.orgId,
					firstName,
					lastName,
					birthdate: randomBirthdateForGroup(rng, groupName),
					email,
					phone: buildPhone(rng),
					street,
					city,
					state: "N/A",
					postalCode,
					country: "Deutschland",
					iban: buildIban(rng),
					bic: pickOne(rng, BICS),
					cardHolder: `${firstName} ${lastName}`,
					notes: memberNotesParts.join("\n"),
				})
				.returning({ id: clubMember.id });

			const insertedMember = insertedMemberRows[0];
			if (!insertedMember) {
				throw new Error("Failed to insert member");
			}

			const insertedContractRows = await tx
				.insert(contract)
				.values({
					memberId: insertedMember.id,
					organizationId: args.orgId,
					initialPeriod,
					startDate: toDateString(contractStart),
					initialPeriodEndDate,
					currentPeriodEndDate,
					nextBillingDate,
					mandateId: generateMandateId(),
					mandateSignatureDate: toDateString(contractStart),
					joiningFeeAmount,
					yearlyFeeAmount,
					joiningFeePaidAt:
						joiningFeeAmount && rng() < 0.85
							? dateAtNoonUtc(addMonths(contractStart, randomInt(rng, 0, 1)))
							: null,
					lastYearlyFeePaidYear: yearlyFeeAmount
						? randomInt(rng, today.getUTCFullYear() - 1, today.getUTCFullYear())
						: null,
					cancelledAt:
						willEndInPast || cancelledButActive
							? cancellationRequestedAt
							: null,
					cancelReason:
						willEndInPast || cancelledButActive
							? pickOne(rng, CANCEL_REASONS)
							: null,
					cancellationEffectiveDate,
					notes: "Demo data generated for realistic sales demos",
				})
				.returning({ id: contract.id });

			const insertedContract = insertedContractRows[0];
			if (!insertedContract) {
				throw new Error("Failed to insert contract");
			}

			await tx.insert(groupMember).values({
				groupId: targetGroupId,
				memberId: insertedMember.id,
				membershipPrice: monthlyMembershipAmount,
			});

			seededContracts.push({
				contractId: insertedContract.id,
				memberId: insertedMember.id,
				monthlyMembershipAmount,
				contractStartDate: toDateString(contractStart),
				cancellationEffectiveDate,
				joiningFeeAmount,
				yearlyFeeAmount,
			});
		});

		createdMembers += 1;
		if (willEndInPast) {
			endedContracts += 1;
		}
		if (cancelledButActive) {
			futureCancelledContracts += 1;
		}
	}

	const monthsToSeed = monthsBetweenInclusive(
		oldestStartMonth,
		lastCompletedMonth,
	);
	const monthStrings = new Set(
		monthsToSeed.map((month) => toDateString(month)),
	);

	const existingBatches = args.dryRun
		? []
		: await db
				.select({
					id: paymentBatch.id,
					billingMonth: paymentBatch.billingMonth,
				})
				.from(paymentBatch)
				.where(
					and(
						eq(paymentBatch.organizationId, args.orgId),
						inArray(
							paymentBatch.billingMonth,
							Array.from(monthStrings.values()),
						),
					),
				);

	const existingMonthSet = new Set(
		existingBatches.map((row) => row.billingMonth),
	);

	let createdBatches = 0;
	let createdPayments = 0;

	if (!args.dryRun) {
		const seededContractIds = seededContracts.map((entry) => entry.contractId);
		const seededContractSet = new Set(seededContractIds);

		for (const billingMonthDate of monthsToSeed) {
			const billingMonth = toDateString(billingMonthDate);
			if (existingMonthSet.has(billingMonth)) {
				continue;
			}

			const activeContractsForMonth = seededContracts.filter((entry) => {
				if (entry.contractStartDate > billingMonth) {
					return false;
				}
				if (!entry.cancellationEffectiveDate) {
					return true;
				}
				return entry.cancellationEffectiveDate >= billingMonth;
			});

			if (activeContractsForMonth.length === 0) {
				continue;
			}

			const insertedBatchRows = await wsDb
				.insert(paymentBatch)
				.values({
					organizationId: args.orgId,
					billingMonth,
					batchNumber: `${labelMonth(billingMonthDate)}-${args.orgId.slice(0, 8).toUpperCase()}`,
					notes: "Demo payment batch for seeded historical contracts",
				})
				.returning({ id: paymentBatch.id });

			const insertedBatch = insertedBatchRows[0];
			if (!insertedBatch) {
				throw new Error(`Failed to create payment batch ${billingMonth}`);
			}

			createdBatches += 1;

			const billingMonthEnd = toDateString(endOfMonth(billingMonthDate));
			for (const contractRecord of activeContractsForMonth) {
				if (!seededContractSet.has(contractRecord.contractId)) {
					continue;
				}

				const joiningFeeAmount =
					contractRecord.joiningFeeAmount &&
					contractRecord.contractStartDate.slice(0, 7) ===
						billingMonth.slice(0, 7)
						? contractRecord.joiningFeeAmount
						: "0.00";
				const yearlyFeeAmount =
					contractRecord.yearlyFeeAmount && billingMonth.endsWith("-01")
						? contractRecord.yearlyFeeAmount
						: "0.00";

				const membershipAmount = toDecimalString(
					contractRecord.monthlyMembershipAmount,
				);
				const totalAmount = toDecimalString(
					Number.parseFloat(membershipAmount) +
						Number.parseFloat(joiningFeeAmount) +
						Number.parseFloat(yearlyFeeAmount),
				);

				await wsDb.insert(payment).values({
					contractId: contractRecord.contractId,
					batchId: insertedBatch.id,
					membershipAmount,
					joiningFeeAmount,
					yearlyFeeAmount,
					totalAmount,
					billingPeriodStart: billingMonth,
					billingPeriodEnd: billingMonthEnd,
					dueDate: billingMonth,
					notes: "Demo payment entry",
				});

				createdPayments += 1;
			}
		}

		if (seededContractIds.length > 0) {
			const totalByBatch = await db
				.select({
					batchId: payment.batchId,
					totalAmount: payment.totalAmount,
					membershipAmount: payment.membershipAmount,
					joiningFeeAmount: payment.joiningFeeAmount,
					yearlyFeeAmount: payment.yearlyFeeAmount,
				})
				.from(payment)
				.where(
					and(
						inArray(payment.contractId, seededContractIds),
						lte(payment.billingPeriodStart, toDateString(currentMonth)),
					),
				);

			const aggregates = new Map<
				string,
				{
					total: number;
					membership: number;
					joining: number;
					yearly: number;
					count: number;
				}
			>();

			for (const row of totalByBatch) {
				const existing =
					aggregates.get(row.batchId) ??
					({
						total: 0,
						membership: 0,
						joining: 0,
						yearly: 0,
						count: 0,
					} as const);

				aggregates.set(row.batchId, {
					total: existing.total + Number.parseFloat(row.totalAmount),
					membership:
						existing.membership + Number.parseFloat(row.membershipAmount),
					joining: existing.joining + Number.parseFloat(row.joiningFeeAmount),
					yearly: existing.yearly + Number.parseFloat(row.yearlyFeeAmount),
					count: existing.count + 1,
				});
			}

			for (const [batchId, values] of aggregates) {
				await wsDb
					.update(paymentBatch)
					.set({
						totalAmount: toDecimalString(values.total),
						membershipTotal: toDecimalString(values.membership),
						joiningFeeTotal: toDecimalString(values.joining),
						yearlyFeeTotal: toDecimalString(values.yearly),
						transactionCount: values.count,
					})
					.where(eq(paymentBatch.id, batchId));
			}
		}
	}

	const mode = args.dryRun ? "dry-run" : "applied";
	console.log(`Seed mode: ${mode}`);
	console.log(`Organization: ${args.orgId}`);
	console.log(
		`Groups ${args.dryRun ? "to create" : "created"}: ${createdGroupNames.length > 0 ? createdGroupNames.join(", ") : "none"}`,
	);
	console.log(
		`Members ${args.dryRun ? "to create" : "created"}: ${createdMembers}`,
	);
	console.log(`Cancelled contracts (ended): ${endedContracts}`);
	console.log(`Cancelled but still active: ${futureCancelledContracts}`);
	console.log(
		`Payment batches ${args.dryRun ? "to create" : "created"}: ${
			args.dryRun ? monthsToSeed.length - existingMonthSet.size : createdBatches
		}`,
	);
	console.log(
		`Payments ${args.dryRun ? "to create" : "created"}: ${createdPayments}`,
	);
}

run().catch((error: unknown) => {
	const message =
		error instanceof Error ? (error.stack ?? error.message) : String(error);
	console.error(message);
	process.exit(1);
});

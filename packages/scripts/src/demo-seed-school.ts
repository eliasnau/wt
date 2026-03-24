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
	monthlyMembershipCents: number;
	contractStartDate: string;
	status: "active" | "cancelled" | "ended";
	cancellationEffectiveDate: string | null;
	joiningFeeCents: number | null;
	yearlyFeeCents: number | null;
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

function generateMandateReference(): string {
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

async function run(): Promise<void> {
	loadEnvForScripts();
	const args = parseArgs(process.argv.slice(2));
	const rng = createRng(hashSeed(`school-seed:${args.orgId}`));

	const { db, eq, wsDb } = await import("@repo/db");
	const {
		clubMember,
		contract,
		group,
		groupMember,
		organization,
		sepaMandate,
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
					defaultMembershipPriceCents: template.defaultPrice * 100,
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

		const status: SeededContract["status"] = willEndInPast
			? "ended"
			: cancelledButActive
				? "cancelled"
				: "active";

		const joiningFeeCents =
			rng() < 0.7 ? randomInt(rng, 15, 40) * 100 : null;
		const yearlyFeeCents =
			rng() < 0.35 ? randomInt(rng, 25, 80) * 100 : null;

		const monthlyMembershipCents =
			Math.max(19, groupTemplate.defaultPrice + randomInt(rng, -5, 6)) * 100;

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
				monthlyMembershipCents,
				contractStartDate: toDateString(contractStart),
				status,
				cancellationEffectiveDate,
				joiningFeeCents,
				yearlyFeeCents,
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
					status,
					initialPeriod,
					startDate: toDateString(contractStart),
					initialPeriodEndDate,
					joiningFeeCents,
					yearlyFeeCents,
					yearlyFeeMode: rng() < 0.75 ? "january" : "anniversary",
					cancelledAt:
						willEndInPast || cancelledButActive
							? cancellationRequestedAt
							: null,
					cancellationReason:
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

			await tx.insert(sepaMandate).values({
				organizationId: args.orgId,
				memberId: insertedMember.id,
				contractId: insertedContract.id,
				mandateReference: generateMandateReference(),
				accountHolder: `${firstName} ${lastName}`,
				iban: buildIban(rng),
				bic: pickOne(rng, BICS),
				signatureDate: toDateString(contractStart),
				isActive: true,
			});

			await tx.insert(groupMember).values({
				groupId: targetGroupId,
				memberId: insertedMember.id,
				membershipPriceCents: monthlyMembershipCents,
			});

			seededContracts.push({
				contractId: insertedContract.id,
				memberId: insertedMember.id,
				monthlyMembershipCents,
				contractStartDate: toDateString(contractStart),
				status,
				cancellationEffectiveDate,
				joiningFeeCents,
				yearlyFeeCents,
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
		`Contracts ${args.dryRun ? "to create" : "created"}: ${seededContracts.length}`,
	);
	console.log(
		`Active mandates ${args.dryRun ? "to create" : "created"}: ${seededContracts.length}`,
	);
}

run().catch((error: unknown) => {
	const message =
		error instanceof Error ? (error.stack ?? error.message) : String(error);
	console.error(message);
	process.exit(1);
});

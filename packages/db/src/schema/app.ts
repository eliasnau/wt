import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const group = pgTable("group", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
	color: text("color").default("#000000").notNull(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	defaultMembershipPriceCents: integer("default_membership_price_cents"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const clubMember = pgTable("club_member", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	birthdate: date("birthdate"),
	email: text("email"),
	phone: text("phone"),
	// Address fields
	street: text("street").notNull(),
	city: text("city").notNull(),
	state: text("state").notNull(),
	postalCode: text("postal_code").notNull(),
	country: text("country").notNull(),
	latitude: decimal("latitude", {
		precision: 10,
		scale: 7,
		mode: "number",
	}),
	longitude: decimal("longitude", {
		precision: 10,
		scale: 7,
		mode: "number",
	}),

	iban: text("iban").notNull(),
	bic: text("bic").notNull(),
	cardHolder: text("card_holder").notNull(),

	// Optional notes about the member
	notes: text("notes"),

	// Optional guardian info
	guardianName: text("guardian_name"),
	guardianEmail: text("guardian_email"),
	guardianPhone: text("guardian_phone"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const groupMember = pgTable(
	"group_member",
	{
		groupId: uuid("group_id")
			.notNull()
			.references(() => group.id, { onDelete: "cascade" }),
		memberId: uuid("member_id")
			.notNull()
			.references(() => clubMember.id, { onDelete: "cascade" }),
		membershipPriceCents: integer("membership_price_cents").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.groupId, table.memberId] }),
		index("group_member_group_id_idx").on(table.groupId),
		index("group_member_member_id_idx").on(table.memberId),
		index("group_member_composite_idx").on(table.groupId, table.memberId),
	],
);

export const selfRegistration = pgTable(
	"self_registration",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		code: text("code").notNull(),
		description: text("description"),
		isActive: boolean("is_active").default(true).notNull(),
		submitted: boolean("submitted").default(false).notNull(),
		status: text("status").notNull().default("draft"), // draft | submitted | created
		memberId: uuid("member_id").references(() => clubMember.id, {
			onDelete: "set null",
		}),
		billingCycle: text("billing_cycle").notNull().default("monthly"),
		joiningFeeCents: integer("joining_fee_cents"),
		yearlyFeeCents: integer("yearly_fee_cents"),
		contractStartDate: date("contract_start_date"),
		notes: text("notes"),
		groupsSnapshot: jsonb("groups_snapshot").notNull(),
		firstName: text("first_name"),
		lastName: text("last_name"),
		email: text("email"),
		phone: text("phone"),
		birthdate: date("birthdate"),
		street: text("street"),
		city: text("city"),
		state: text("state"),
		postalCode: text("postal_code"),
		country: text("country"),
		accountHolder: text("account_holder"),
		iban: text("iban"),
		bic: text("bic"),
		submittedAt: timestamp("submitted_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("self_registration_org_id_idx").on(table.organizationId),
		index("self_registration_active_idx").on(table.isActive),
		index("self_registration_submitted_idx").on(table.submitted),
		index("self_registration_member_id_idx").on(table.memberId),
		index("self_registration_status_idx").on(table.status),
		unique("self_registration_code_unique").on(table.code),
	],
);

export const clubMemberRelations = relations(clubMember, ({ many }) => ({
	groupMembers: many(groupMember),
	contracts: many(contract),
}));

export const groupRelations = relations(group, ({ many }) => ({
	groupMembers: many(groupMember),
}));

export const groupMemberRelations = relations(groupMember, ({ one }) => ({
	group: one(group, {
		fields: [groupMember.groupId],
		references: [group.id],
	}),
	member: one(clubMember, {
		fields: [groupMember.memberId],
		references: [clubMember.id],
	}),
}));

export const selfRegistrationRelations = relations(
	selfRegistration,
	({ one }) => ({
		organization: one(organization, {
			fields: [selfRegistration.organizationId],
			references: [organization.id],
		}),
	}),
);

export const contract = pgTable(
	"contract",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		memberId: uuid("member_id")
			.notNull()
			.references(() => clubMember.id, { onDelete: "restrict" }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "restrict" }),

		initialPeriod: text("initial_period").notNull(), // "monthly" | "half_yearly" | "yearly"
		status: text("status").notNull().default("active"), // active | cancelled | ended

		startDate: date("start_date").notNull(), // (always 1st of month)
		initialPeriodEndDate: date("initial_period_end_date").notNull(),
		cancellationNoticeDays: integer("cancellation_notice_days")
			.notNull()
			.default(0),
		yearlyFeeMode: text("yearly_fee_mode").notNull().default("january"),
		settledThroughDate: date("settled_through_date"),
		joiningFeeCents: integer("joining_fee_cents"),
		joiningFeePaid: boolean("joining_fee_paid").notNull().default(false),
		yearlyFeeCents: integer("yearly_fee_cents"),

		cancelledAt: timestamp("cancelled_at"),
		cancellationReason: text("cancellation_reason"),
		cancellationEffectiveDate: date("cancellation_effective_date"), // When contract actually ends

		notes: text("notes"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("contract_member_id_idx").on(table.memberId),
		index("contract_org_id_idx").on(table.organizationId),
	],
);

export const sepaMandate = pgTable(
	"sepa_mandate",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "restrict" }),
		memberId: uuid("member_id")
			.notNull()
			.references(() => clubMember.id, { onDelete: "restrict" }),
		contractId: uuid("contract_id")
			.notNull()
			.references(() => contract.id, { onDelete: "restrict" }),
		mandateReference: text("mandate_reference").notNull(),
		accountHolder: text("account_holder").notNull(),
		iban: text("iban").notNull(),
		bic: text("bic").notNull(),
		signatureDate: date("signature_date").notNull(),
		isActive: boolean("is_active").notNull().default(true),
		revokedAt: timestamp("revoked_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("sepa_mandate_org_idx").on(table.organizationId),
		index("sepa_mandate_member_idx").on(table.memberId),
		index("sepa_mandate_contract_idx").on(table.contractId),
		unique("sepa_mandate_reference_unique").on(table.mandateReference),
	],
);

export const creditGrant = pgTable(
	"credit_grant",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "restrict" }),
		memberId: uuid("member_id")
			.notNull()
			.references(() => clubMember.id, { onDelete: "restrict" }),
		contractId: uuid("contract_id")
			.notNull()
			.references(() => contract.id, { onDelete: "restrict" }),
		type: text("type").notNull(), // money | billing_cycles
		originalAmountCents: integer("original_amount_cents"),
		remainingAmountCents: integer("remaining_amount_cents"),
		originalCycles: integer("original_cycles"),
		remainingCycles: integer("remaining_cycles"),
		validFrom: date("valid_from"),
		expiresAt: date("expires_at"),
		description: text("description"),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("credit_grant_org_idx").on(table.organizationId),
		index("credit_grant_member_idx").on(table.memberId),
		index("credit_grant_contract_idx").on(table.contractId),
	],
);

export const invoice = pgTable(
	"invoice",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "restrict" }),
		memberId: uuid("member_id")
			.notNull()
			.references(() => clubMember.id, { onDelete: "restrict" }),
		contractId: uuid("contract_id")
			.notNull()
			.references(() => contract.id, { onDelete: "restrict" }),
		billingPeriodStart: date("billing_period_start").notNull(),
		billingPeriodEnd: date("billing_period_end").notNull(),
		status: text("status").notNull().default("draft"), // draft | finalized | void
		currency: text("currency").notNull().default("EUR"),
		totalCents: integer("total_cents").notNull().default(0),
		voidReason: text("void_reason"),
		replacedByInvoiceId: uuid("replaced_by_invoice_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		finalizedAt: timestamp("finalized_at"),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("invoice_org_idx").on(table.organizationId),
		index("invoice_member_idx").on(table.memberId),
		index("invoice_contract_idx").on(table.contractId),
		index("invoice_period_idx").on(table.contractId, table.billingPeriodStart),
	],
);

export const invoiceLine = pgTable(
	"invoice_line",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "restrict" }),
		invoiceId: uuid("invoice_id")
			.notNull()
			.references(() => invoice.id, { onDelete: "restrict" }),
		type: text("type").notNull(),
		description: text("description").notNull(),
		quantity: integer("quantity").notNull().default(1),
		unitAmountCents: integer("unit_amount_cents").notNull(),
		totalAmountCents: integer("total_amount_cents").notNull(),
		coverageStart: date("coverage_start"),
		coverageEnd: date("coverage_end"),
		groupId: uuid("group_id").references(() => group.id, {
			onDelete: "set null",
		}),
		creditGrantId: uuid("credit_grant_id").references(() => creditGrant.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("invoice_line_org_idx").on(table.organizationId),
		index("invoice_line_invoice_idx").on(table.invoiceId),
		index("invoice_line_group_idx").on(table.groupId),
		index("invoice_line_credit_grant_idx").on(table.creditGrantId),
	],
);

export const sepaBatch = pgTable(
	"sepa_batch",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "restrict" }),
		collectionDate: date("collection_date").notNull(),
		sequenceNumber: integer("sequence_number").notNull(),
		batchNumber: text("batch_number").notNull(),
		status: text("status").notNull().default("generated"), // generated | downloaded | void | superseded
		totalAmountCents: integer("total_amount_cents").notNull().default(0),
		transactionCount: integer("transaction_count").notNull().default(0),
		xmlFilePath: text("xml_file_path"),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		generatedAt: timestamp("generated_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("sepa_batch_org_idx").on(table.organizationId),
		index("sepa_batch_collection_date_idx").on(table.collectionDate),
		unique("sepa_batch_org_collection_sequence_unique").on(
			table.organizationId,
			table.collectionDate,
			table.sequenceNumber,
		),
	],
);

export const sepaBatchItem = pgTable(
	"sepa_batch_item",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "restrict" }),
		sepaBatchId: uuid("sepa_batch_id")
			.notNull()
			.references(() => sepaBatch.id, { onDelete: "restrict" }),
		invoiceId: uuid("invoice_id")
			.notNull()
			.references(() => invoice.id, { onDelete: "restrict" }),
		sepaMandateId: uuid("sepa_mandate_id")
			.notNull()
			.references(() => sepaMandate.id, { onDelete: "restrict" }),
		amountCents: integer("amount_cents").notNull(),
		status: text("status").notNull().default("included"), // included | removed
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("sepa_batch_item_org_idx").on(table.organizationId),
		index("sepa_batch_item_batch_idx").on(table.sepaBatchId),
		index("sepa_batch_item_invoice_idx").on(table.invoiceId),
		unique("sepa_batch_item_batch_invoice_unique").on(
			table.sepaBatchId,
			table.invoiceId,
		),
	],
);

export const organizationSettings = pgTable(
	"organization_settings",
	{
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" })
			.primaryKey(),
		creditorName: text("creditor_name"),
		creditorIban: text("creditor_iban"),
		creditorBic: text("creditor_bic"),
		creditorId: text("creditor_id"),
		initiatorName: text("initiator_name"),
		batchBooking: boolean("batch_booking").default(true),
		remittanceMembership: text("remittance_membership"),
		remittanceJoiningFee: text("remittance_joining_fee"),
		remittanceYearlyFee: text("remittance_yearly_fee"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("organization_settings_org_id_idx").on(table.organizationId),
	],
);

export const contractRelations = relations(contract, ({ one, many }) => ({
	member: one(clubMember, {
		fields: [contract.memberId],
		references: [clubMember.id],
	}),
	organization: one(organization, {
		fields: [contract.organizationId],
		references: [organization.id],
	}),
	sepaMandates: many(sepaMandate),
	invoices: many(invoice),
	creditGrants: many(creditGrant),
}));

export const sepaMandateRelations = relations(sepaMandate, ({ one }) => ({
	organization: one(organization, {
		fields: [sepaMandate.organizationId],
		references: [organization.id],
	}),
	member: one(clubMember, {
		fields: [sepaMandate.memberId],
		references: [clubMember.id],
	}),
	contract: one(contract, {
		fields: [sepaMandate.contractId],
		references: [contract.id],
	}),
}));

export const creditGrantRelations = relations(creditGrant, ({ one, many }) => ({
	organization: one(organization, {
		fields: [creditGrant.organizationId],
		references: [organization.id],
	}),
	member: one(clubMember, {
		fields: [creditGrant.memberId],
		references: [clubMember.id],
	}),
	contract: one(contract, {
		fields: [creditGrant.contractId],
		references: [contract.id],
	}),
	invoiceLines: many(invoiceLine),
}));

export const invoiceRelations = relations(invoice, ({ one, many }) => ({
	organization: one(organization, {
		fields: [invoice.organizationId],
		references: [organization.id],
	}),
	member: one(clubMember, {
		fields: [invoice.memberId],
		references: [clubMember.id],
	}),
	contract: one(contract, {
		fields: [invoice.contractId],
		references: [contract.id],
	}),
	lines: many(invoiceLine),
	sepaBatchItems: many(sepaBatchItem),
}));

export const invoiceLineRelations = relations(invoiceLine, ({ one }) => ({
	organization: one(organization, {
		fields: [invoiceLine.organizationId],
		references: [organization.id],
	}),
	invoice: one(invoice, {
		fields: [invoiceLine.invoiceId],
		references: [invoice.id],
	}),
	group: one(group, {
		fields: [invoiceLine.groupId],
		references: [group.id],
	}),
	creditGrant: one(creditGrant, {
		fields: [invoiceLine.creditGrantId],
		references: [creditGrant.id],
	}),
}));

export const sepaBatchRelations = relations(sepaBatch, ({ one, many }) => ({
	organization: one(organization, {
		fields: [sepaBatch.organizationId],
		references: [organization.id],
	}),
	items: many(sepaBatchItem),
}));

export const sepaBatchItemRelations = relations(sepaBatchItem, ({ one }) => ({
	organization: one(organization, {
		fields: [sepaBatchItem.organizationId],
		references: [organization.id],
	}),
	batch: one(sepaBatch, {
		fields: [sepaBatchItem.sepaBatchId],
		references: [sepaBatch.id],
	}),
	invoice: one(invoice, {
		fields: [sepaBatchItem.invoiceId],
		references: [invoice.id],
	}),
	sepaMandate: one(sepaMandate, {
		fields: [sepaBatchItem.sepaMandateId],
		references: [sepaMandate.id],
	}),
}));

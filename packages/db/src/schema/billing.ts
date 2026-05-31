import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { clubMember, group } from "./members";

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

    // monthly | half_yearly | yearly
    initialPeriod: text("initial_period").notNull(),
    // active | cancelled | ended
    status: text("status").notNull().default("active"),

    // always 1st of month
    startDate: date("start_date").notNull(),
    initialPeriodEndDate: date("initial_period_end_date").notNull(),
    cancellationNoticeDays: integer("cancellation_notice_days")
      .notNull()
      .default(0),
    // january | anniversary
    yearlyFeeMode: text("yearly_fee_mode").notNull().default("january"),
    settledThroughDate: date("settled_through_date"),
    joiningFeeCents: integer("joining_fee_cents"),
    joiningFeePaid: boolean("joining_fee_paid").notNull().default(false),
    yearlyFeeCents: integer("yearly_fee_cents"),

    cancelledAt: timestamp("cancelled_at"),
    cancellationReason: text("cancellation_reason"),
    // When the contract actually ends
    cancellationEffectiveDate: date("cancellation_effective_date"),

    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("contract_member_unique").on(table.memberId),
    index("contract_member_id_idx").on(table.memberId),
    index("contract_org_id_idx").on(table.organizationId),
    // Statistics: per-month enrollment + active-member-baseline scans.
    index("contract_org_start_date_idx").on(
      table.organizationId,
      table.startDate,
    ),
    // Statistics: per-month cancellation (churn) scans.
    index("contract_org_cancellation_effective_idx").on(
      table.organizationId,
      table.cancellationEffectiveDate,
    ),
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
    // money | billing_cycles
    type: text("type").notNull(),
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
    // draft | finalized | void
    status: text("status").notNull().default("draft"),
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
    // Statistics: finalized-revenue-by-period scans (billed/submitted/outstanding).
    index("invoice_org_status_period_idx").on(
      table.organizationId,
      table.status,
      table.billingPeriodStart,
    ),
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
    // membership_fee | arrears | joining_fee | yearly_fee | waiver |
    // credit_money | credit_cycle
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
    // generated | downloaded | void | superseded
    status: text("status").notNull().default("generated"),
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
    // included | removed
    status: text("status").notNull().default("included"),
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

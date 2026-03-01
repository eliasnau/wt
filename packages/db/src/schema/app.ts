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
  defaultMembershipPrice: decimal("default_membership_price", {
    precision: 10,
    scale: 2,
  }),
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
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  // Address fields
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),

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
    membershipPrice: decimal("membership_price", {
      precision: 10,
      scale: 2,
    }),
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
    status: text("status").notNull().default("draft"), // draft | submitted | created
    billingCycle: text("billing_cycle").notNull().default("monthly"),
    joiningFeeAmount: decimal("joining_fee_amount", {
      precision: 10,
      scale: 2,
    }),
    yearlyFeeAmount: decimal("yearly_fee_amount", {
      precision: 10,
      scale: 2,
    }),
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
    index("self_registration_status_idx").on(table.status),
    unique("self_registration_code_unique").on(table.code),
  ],
);

export const clubMemberRelations = relations(clubMember, ({ many, one }) => ({
  groupMembers: many(groupMember),
  contract: one(contract, {
    fields: [clubMember.id],
    references: [contract.memberId],
  }),
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
      .references(() => clubMember.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    initialPeriod: text("initial_period").notNull(), // "monthly" | "half_yearly" | "yearly"

    startDate: date("start_date").notNull(), // (always 1st of month)
    initialPeriodEndDate: date("initial_period_end_date").notNull(),
    currentPeriodEndDate: date("current_period_end_date").notNull(),
    nextBillingDate: date("next_billing_date").notNull(),
    mandateId: text("mandate_id").notNull(),
    mandateSignatureDate: date("mandate_signature_date").notNull(),

    joiningFeeAmount: decimal("joining_fee_amount", {
      precision: 10,
      scale: 2,
    }), // One-time joining fee
    yearlyFeeAmount: decimal("yearly_fee_amount", {
      precision: 10,
      scale: 2,
    }), // Annual fee (charged in January)

    joiningFeePaidAt: timestamp("joining_fee_paid_at"), // null = not paid yet
    lastYearlyFeePaidYear: integer("last_yearly_fee_paid_year"), // e.g., 2025 (track which year was last paid)

    cancelledAt: timestamp("cancelled_at"),
    cancelReason: text("cancel_reason"),
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
    index("contract_next_billing_idx").on(table.nextBillingDate), // For batch generation queries
    unique("contract_mandate_id_unique").on(table.mandateId),
    unique("contract_member_unique").on(table.memberId), // One contract per member
  ],
);

export const paymentBatch = pgTable(
  "payment_batch",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    billingMonth: date("billing_month").notNull(), // Which month this is for (always 1st of month, e.g., 2025-02-01)
    batchNumber: text("batch_number"), // Human-readable identifier (e.g., "2025-02-ORG123")

    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default(
      "0",
    ),
    membershipTotal: decimal("membership_total", {
      precision: 10,
      scale: 2,
    }).default("0"),
    joiningFeeTotal: decimal("joining_fee_total", {
      precision: 10,
      scale: 2,
    }).default("0"),
    yearlyFeeTotal: decimal("yearly_fee_total", {
      precision: 10,
      scale: 2,
    }).default("0"),
    transactionCount: integer("transaction_count").default(0),

    // Metadata
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payment_batch_org_id_idx").on(table.organizationId),
    index("payment_batch_billing_month_idx").on(table.billingMonth),
    unique("payment_batch_org_month_unique").on(
      table.organizationId,
      table.billingMonth,
    ), // One batch per org per month
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

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contract.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => paymentBatch.id, {
        onDelete: "cascade",
      }), // Delete payments when batch is deleted

    membershipAmount: decimal("membership_amount", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"),
    joiningFeeAmount: decimal("joining_fee_amount", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"),
    yearlyFeeAmount: decimal("yearly_fee_amount", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // Sum of above three

    billingPeriodStart: date("billing_period_start").notNull(), // e.g., 2025-02-01
    billingPeriodEnd: date("billing_period_end").notNull(), // e.g., 2025-02-28
    dueDate: date("due_date").notNull(), // Always 1st of month (e.g., 2025-02-01)

    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payment_contract_id_idx").on(table.contractId),
    index("payment_batch_id_idx").on(table.batchId),
    index("payment_due_date_idx").on(table.dueDate),
    index("payment_billing_period_idx").on(
      table.billingPeriodStart,
      table.billingPeriodEnd,
    ),
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
  payments: many(payment),
}));

export const paymentBatchRelations = relations(
  paymentBatch,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [paymentBatch.organizationId],
      references: [organization.id],
    }),
    payments: many(payment),
  }),
);

export const paymentRelations = relations(payment, ({ one }) => ({
  contract: one(contract, {
    fields: [payment.contractId],
    references: [contract.id],
  }),
  batch: one(paymentBatch, {
    fields: [payment.batchId],
    references: [paymentBatch.id],
  }),
}));

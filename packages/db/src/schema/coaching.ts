import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth";
import { clubMember } from "./members";

export const coachingAppointment = pgTable(
  "coaching_appointment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    coachUserId: text("coach_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    date: date("date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    location: text("location"),
    status: text("status").notNull().default("scheduled"),
    priceCents: integer("price_cents"),
    paymentStatus: text("payment_status").notNull().default("open"),
    notes: text("notes"),
    cancellationReason: text("cancellation_reason"),
    attendanceRecordedAt: timestamp("attendance_recorded_at"),
    attendanceRecordedByUserId: text("attendance_recorded_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("coaching_appointment_org_date_idx").on(table.organizationId, table.date),
    index("coaching_appointment_coach_date_idx").on(table.coachUserId, table.date),
    check("coaching_appointment_time_order", sql`${table.endTime} > ${table.startTime}`),
    check(
      "coaching_appointment_price_nonnegative",
      sql`${table.priceCents} IS NULL OR ${table.priceCents} >= 0`,
    ),
    check(
      "coaching_appointment_status",
      sql`${table.status} IN ('scheduled', 'attended', 'no_show', 'cancelled')`,
    ),
    check(
      "coaching_appointment_payment_status",
      sql`${table.paymentStatus} IN ('open', 'paid', 'waived')`,
    ),
  ],
);

export const coachingParticipant = pgTable(
  "coaching_participant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => coachingAppointment.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => clubMember.id, { onDelete: "cascade" }),
    guestName: text("guest_name"),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("coaching_participant_appointment_idx").on(table.appointmentId),
    index("coaching_participant_member_idx").on(table.memberId),
    uniqueIndex("coaching_participant_member_unique_idx")
      .on(table.appointmentId, table.memberId)
      .where(sql`${table.memberId} IS NOT NULL`),
    check(
      "coaching_participant_identity",
      sql`num_nonnulls(${table.memberId}, ${table.guestName}) = 1`,
    ),
  ],
);

export const coachingAppointmentRelations = relations(coachingAppointment, ({ one, many }) => ({
  organization: one(organization, {
    fields: [coachingAppointment.organizationId],
    references: [organization.id],
  }),
  coach: one(user, { fields: [coachingAppointment.coachUserId], references: [user.id] }),
  participants: many(coachingParticipant),
}));

export const coachingParticipantRelations = relations(coachingParticipant, ({ one }) => ({
  appointment: one(coachingAppointment, {
    fields: [coachingParticipant.appointmentId],
    references: [coachingAppointment.id],
  }),
  member: one(clubMember, { fields: [coachingParticipant.memberId], references: [clubMember.id] }),
}));

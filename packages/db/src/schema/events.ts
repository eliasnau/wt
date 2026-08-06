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

import { organization } from "./auth";
import { clubMember } from "./members";

export const event = pgTable(
  "event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    date: date("date").notNull(),
    startTime: time("start_time"),
    endTime: time("end_time"),
    location: text("location"),
    priceCents: integer("price_cents"),
    capacity: integer("capacity"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("event_org_date_idx").on(table.organizationId, table.date),
    check("event_price_nonnegative", sql`${table.priceCents} IS NULL OR ${table.priceCents} >= 0`),
    check("event_capacity_nonnegative", sql`${table.capacity} IS NULL OR ${table.capacity} >= 0`),
    check(
      "event_time_pair",
      sql`(${table.startTime} IS NULL AND ${table.endTime} IS NULL) OR (${table.startTime} IS NOT NULL AND ${table.endTime} IS NOT NULL)`,
    ),
    check(
      "event_time_order",
      sql`${table.startTime} IS NULL OR ${table.endTime} > ${table.startTime}`,
    ),
  ],
);

export const eventParticipant = pgTable(
  "event_participant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => clubMember.id, {
      onDelete: "cascade",
    }),
    guestName: text("guest_name"),
    status: text("status").notNull().default("registered"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("event_participant_event_status_idx").on(table.eventId, table.status),
    index("event_participant_member_idx").on(table.memberId),
    check(
      "event_participant_identity",
      sql`num_nonnulls(${table.memberId}, ${table.guestName}) = 1`,
    ),
    check(
      "event_participant_status",
      sql`${table.status} IN ('registered', 'attended', 'no_show', 'cancelled')`,
    ),
    uniqueIndex("event_participant_active_member_unique_idx")
      .on(table.eventId, table.memberId)
      .where(sql`${table.memberId} IS NOT NULL AND ${table.status} <> 'cancelled'`),
  ],
);

export const eventRelations = relations(event, ({ one, many }) => ({
  organization: one(organization, {
    fields: [event.organizationId],
    references: [organization.id],
  }),
  participants: many(eventParticipant),
}));

export const eventParticipantRelations = relations(eventParticipant, ({ one }) => ({
  event: one(event, {
    fields: [eventParticipant.eventId],
    references: [event.id],
  }),
  member: one(clubMember, {
    fields: [eventParticipant.memberId],
    references: [clubMember.id],
  }),
}));

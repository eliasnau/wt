import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organization } from "./auth";
import { event } from "./events";
import { clubMember, group } from "./members";

export const progressionSystem = pgTable(
  "progression_system",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    unitLabel: text("unit_label").notNull().default("Graduierung"),
    mode: text("mode").notNull().default("sequential"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("progression_system_org_idx").on(table.organizationId),
    check("progression_system_mode", sql`${table.mode} IN ('sequential', 'collection')`),
  ],
);

export const progressionRank = pgTable(
  "progression_rank",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    progressionSystemId: uuid("progression_system_id")
      .notNull()
      .references(() => progressionSystem.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("progression_rank_system_idx").on(table.progressionSystemId),
    uniqueIndex("progression_rank_system_order_unique_idx").on(
      table.progressionSystemId,
      table.sortOrder,
    ),
  ],
);

export const memberRank = pgTable(
  "member_rank",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => clubMember.id, { onDelete: "cascade" }),
    progressionSystemId: uuid("progression_system_id")
      .notNull()
      .references(() => progressionSystem.id, { onDelete: "restrict" }),
    progressionRankId: uuid("progression_rank_id")
      .notNull()
      .references(() => progressionRank.id, { onDelete: "restrict" }),
    eventId: uuid("event_id").references(() => event.id, {
      onDelete: "set null",
    }),
    awardedOn: date("awarded_on").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("member_rank_org_member_idx").on(table.organizationId, table.memberId),
    index("member_rank_system_idx").on(table.progressionSystemId),
    index("member_rank_rank_idx").on(table.progressionRankId),
    uniqueIndex("member_rank_member_rank_unique_idx").on(table.memberId, table.progressionRankId),
  ],
);

export const progressionSystemRelations = relations(progressionSystem, ({ one, many }) => ({
  organization: one(organization, {
    fields: [progressionSystem.organizationId],
    references: [organization.id],
  }),
  ranks: many(progressionRank),
  groups: many(group),
  awards: many(memberRank),
}));

export const progressionRankRelations = relations(progressionRank, ({ one, many }) => ({
  system: one(progressionSystem, {
    fields: [progressionRank.progressionSystemId],
    references: [progressionSystem.id],
  }),
  awards: many(memberRank),
}));

export const memberRankRelations = relations(memberRank, ({ one }) => ({
  member: one(clubMember, {
    fields: [memberRank.memberId],
    references: [clubMember.id],
  }),
  system: one(progressionSystem, {
    fields: [memberRank.progressionSystemId],
    references: [progressionSystem.id],
  }),
  rank: one(progressionRank, {
    fields: [memberRank.progressionRankId],
    references: [progressionRank.id],
  }),
  event: one(event, {
    fields: [memberRank.eventId],
    references: [event.id],
  }),
}));

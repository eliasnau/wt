import { pgTable, text, timestamp, decimal, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { sql } from "drizzle-orm";

export const group = pgTable("group", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
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

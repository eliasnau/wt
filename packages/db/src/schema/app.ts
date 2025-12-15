import { pgTable, text, timestamp, decimal, uuid } from "drizzle-orm/pg-core";

export const group = pgTable("group", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
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

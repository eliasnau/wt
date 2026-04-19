import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const inventoryProduct = pgTable(
	"inventory_product",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("inventory_product_org_idx").on(table.organizationId),
		index("inventory_product_created_at_idx").on(table.createdAt),
	],
);

export const inventoryProductAttribute = pgTable(
	"inventory_product_attribute",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		productId: uuid("product_id")
			.notNull()
			.references(() => inventoryProduct.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		position: integer("position").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("inventory_product_attribute_product_idx").on(table.productId),
		unique("inventory_product_attribute_name_unique").on(
			table.productId,
			table.name,
		),
	],
);

export const inventoryProductAttributeValue = pgTable(
	"inventory_product_attribute_value",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		attributeId: uuid("attribute_id")
			.notNull()
			.references(() => inventoryProductAttribute.id, { onDelete: "cascade" }),
		value: text("value").notNull(),
		position: integer("position").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("inventory_product_attribute_value_attribute_idx").on(
			table.attributeId,
		),
		unique("inventory_product_attribute_value_unique").on(
			table.attributeId,
			table.value,
		),
	],
);

export const inventoryVariant = pgTable(
	"inventory_variant",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		productId: uuid("product_id")
			.notNull()
			.references(() => inventoryProduct.id, { onDelete: "cascade" }),
		combinationKey: text("combination_key").notNull(),
		options: jsonb("options")
			.$type<Array<{ attributeName: string; value: string }>>()
			.notNull(),
		quantity: integer("quantity").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("inventory_variant_product_idx").on(table.productId),
		unique("inventory_variant_product_combination_unique").on(
			table.productId,
			table.combinationKey,
		),
	],
);

export const inventoryProductRelations = relations(
	inventoryProduct,
	({ many }) => ({
		attributes: many(inventoryProductAttribute),
		variants: many(inventoryVariant),
	}),
);

export const inventoryProductAttributeRelations = relations(
	inventoryProductAttribute,
	({ one, many }) => ({
		product: one(inventoryProduct, {
			fields: [inventoryProductAttribute.productId],
			references: [inventoryProduct.id],
		}),
		values: many(inventoryProductAttributeValue),
	}),
);

export const inventoryProductAttributeValueRelations = relations(
	inventoryProductAttributeValue,
	({ one }) => ({
		attribute: one(inventoryProductAttribute, {
			fields: [inventoryProductAttributeValue.attributeId],
			references: [inventoryProductAttribute.id],
		}),
	}),
);

export const inventoryVariantRelations = relations(
	inventoryVariant,
	({ one }) => ({
		product: one(inventoryProduct, {
			fields: [inventoryVariant.productId],
			references: [inventoryProduct.id],
		}),
	}),
);

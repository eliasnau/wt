CREATE TABLE "inventory_product" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_product_attribute" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "name" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "inventory_product_attribute_name_unique" UNIQUE("product_id","name")
);
--> statement-breakpoint
CREATE TABLE "inventory_product_attribute_value" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "attribute_id" uuid NOT NULL,
  "value" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "inventory_product_attribute_value_unique" UNIQUE("attribute_id","value")
);
--> statement-breakpoint
CREATE TABLE "inventory_variant" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "combination_key" text NOT NULL,
  "options" jsonb NOT NULL,
  "quantity" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "inventory_variant_product_combination_unique" UNIQUE("product_id","combination_key")
);
--> statement-breakpoint
ALTER TABLE "inventory_product" ADD CONSTRAINT "inventory_product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory_product_attribute" ADD CONSTRAINT "inventory_product_attribute_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_product"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory_product_attribute_value" ADD CONSTRAINT "inventory_product_attribute_value_attribute_id_inventory_product_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."inventory_product_attribute"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory_variant" ADD CONSTRAINT "inventory_variant_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_product"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "inventory_product_org_idx" ON "inventory_product" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "inventory_product_created_at_idx" ON "inventory_product" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "inventory_product_attribute_product_idx" ON "inventory_product_attribute" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX "inventory_product_attribute_value_attribute_idx" ON "inventory_product_attribute_value" USING btree ("attribute_id");
--> statement-breakpoint
CREATE INDEX "inventory_variant_product_idx" ON "inventory_variant" USING btree ("product_id");

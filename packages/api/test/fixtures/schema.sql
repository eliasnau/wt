CREATE TYPE "public"."credit_grant_type" AS ENUM('money', 'billing_cycles');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"inviter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_role" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"permission" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"active_organization_id" text,
	"impersonated_by" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"verified" boolean DEFAULT true,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"initial_period" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" date NOT NULL,
	"initial_period_end_date" date NOT NULL,
	"cancellation_notice_days" integer DEFAULT 0 NOT NULL,
	"yearly_fee_mode" text DEFAULT 'january' NOT NULL,
	"settled_through_date" date,
	"joining_fee_cents" integer,
	"joining_fee_paid" boolean DEFAULT false NOT NULL,
	"yearly_fee_cents" integer,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"cancellation_effective_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contract_member_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "credit_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"type" "public"."credit_grant_type" NOT NULL,
	"original_amount_cents" integer,
	"remaining_amount_cents" integer,
	"original_cycles" integer,
	"remaining_cycles" integer,
	"valid_from" date,
	"expires_at" date,
	"description" text,
	"notes" text,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"billing_period_start" date NOT NULL,
	"billing_period_end" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"void_reason" text,
	"replaced_by_invoice_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finalized_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"invoice_id" uuid NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_amount_cents" integer NOT NULL,
	"total_amount_cents" integer NOT NULL,
	"coverage_start" date,
	"coverage_end" date,
	"group_id" uuid,
	"credit_grant_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_settings" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"creditor_name" text,
	"creditor_iban" text,
	"creditor_bic" text,
	"creditor_id" text,
	"initiator_name" text,
	"batch_booking" boolean DEFAULT true,
	"remittance_membership" text,
	"remittance_joining_fee" text,
	"remittance_yearly_fee" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sepa_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"collection_date" date NOT NULL,
	"sequence_number" integer NOT NULL,
	"batch_number" text NOT NULL,
	"status" text DEFAULT 'generated' NOT NULL,
	"total_amount_cents" integer DEFAULT 0 NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"xml_file_path" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sepa_batch_org_collection_sequence_unique" UNIQUE("organization_id","collection_date","sequence_number")
);
--> statement-breakpoint
CREATE TABLE "sepa_batch_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"sepa_batch_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"sepa_mandate_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'included' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sepa_batch_item_batch_invoice_unique" UNIQUE("sepa_batch_id","invoice_id")
);
--> statement-breakpoint
CREATE TABLE "sepa_mandate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"mandate_reference" text NOT NULL,
	"account_holder" text NOT NULL,
	"iban" text NOT NULL,
	"bic" text NOT NULL,
	"signature_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sepa_mandate_reference_unique" UNIQUE("mandate_reference")
);
--> statement-breakpoint
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
CREATE TABLE "club_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birthdate" date,
	"email" text,
	"phone" text,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"iban" text NOT NULL,
	"bic" text NOT NULL,
	"card_holder" text NOT NULL,
	"notes" text,
	"guardian_name" text,
	"guardian_email" text,
	"guardian_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#000000' NOT NULL,
	"default_membership_price_cents" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"membership_price_cents" integer DEFAULT 0 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "self_registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"submitted" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"member_id" uuid,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"joining_fee_cents" integer,
	"yearly_fee_cents" integer,
	"contract_start_date" date,
	"notes" text,
	"groups_snapshot" jsonb NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"birthdate" date,
	"street" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"account_holder" text,
	"iban" text,
	"bic" text,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "self_registration_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_role" ADD CONSTRAINT "organization_role_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract" ADD CONSTRAINT "contract_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract" ADD CONSTRAINT "contract_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_grant" ADD CONSTRAINT "credit_grant_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_grant" ADD CONSTRAINT "credit_grant_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_grant" ADD CONSTRAINT "credit_grant_contract_id_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contract"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_contract_id_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contract"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_credit_grant_id_credit_grant_id_fk" FOREIGN KEY ("credit_grant_id") REFERENCES "public"."credit_grant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepa_batch" ADD CONSTRAINT "sepa_batch_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepa_batch_item" ADD CONSTRAINT "sepa_batch_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepa_batch_item" ADD CONSTRAINT "sepa_batch_item_sepa_batch_id_sepa_batch_id_fk" FOREIGN KEY ("sepa_batch_id") REFERENCES "public"."sepa_batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepa_batch_item" ADD CONSTRAINT "sepa_batch_item_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepa_batch_item" ADD CONSTRAINT "sepa_batch_item_sepa_mandate_id_sepa_mandate_id_fk" FOREIGN KEY ("sepa_mandate_id") REFERENCES "public"."sepa_mandate"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepa_mandate" ADD CONSTRAINT "sepa_mandate_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepa_mandate" ADD CONSTRAINT "sepa_mandate_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepa_mandate" ADD CONSTRAINT "sepa_mandate_contract_id_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contract"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_product" ADD CONSTRAINT "inventory_product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_product_attribute" ADD CONSTRAINT "inventory_product_attribute_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_product_attribute_value" ADD CONSTRAINT "inventory_product_attribute_value_attribute_id_inventory_product_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."inventory_product_attribute"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_variant" ADD CONSTRAINT "inventory_variant_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member" ADD CONSTRAINT "club_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group" ADD CONSTRAINT "group_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_registration" ADD CONSTRAINT "self_registration_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_registration" ADD CONSTRAINT "self_registration_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizationRole_organizationId_idx" ON "organization_role" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organizationRole_role_idx" ON "organization_role" USING btree ("role");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "contract_member_id_idx" ON "contract" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "contract_org_id_idx" ON "contract" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "contract_org_start_date_idx" ON "contract" USING btree ("organization_id","start_date");--> statement-breakpoint
CREATE INDEX "contract_org_cancellation_effective_idx" ON "contract" USING btree ("organization_id","cancellation_effective_date");--> statement-breakpoint
CREATE INDEX "credit_grant_org_idx" ON "credit_grant" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "credit_grant_member_idx" ON "credit_grant" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "credit_grant_contract_idx" ON "credit_grant" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "invoice_org_idx" ON "invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_member_idx" ON "invoice" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "invoice_contract_idx" ON "invoice" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "invoice_period_idx" ON "invoice" USING btree ("contract_id","billing_period_start");--> statement-breakpoint
CREATE INDEX "invoice_org_status_period_idx" ON "invoice" USING btree ("organization_id","status","billing_period_start");--> statement-breakpoint
CREATE INDEX "invoice_line_org_idx" ON "invoice_line" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_line_invoice_idx" ON "invoice_line" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_line_group_idx" ON "invoice_line" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "invoice_line_credit_grant_idx" ON "invoice_line" USING btree ("credit_grant_id");--> statement-breakpoint
CREATE INDEX "organization_settings_org_id_idx" ON "organization_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sepa_batch_org_idx" ON "sepa_batch" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sepa_batch_collection_date_idx" ON "sepa_batch" USING btree ("collection_date");--> statement-breakpoint
CREATE INDEX "sepa_batch_item_org_idx" ON "sepa_batch_item" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sepa_batch_item_batch_idx" ON "sepa_batch_item" USING btree ("sepa_batch_id");--> statement-breakpoint
CREATE INDEX "sepa_batch_item_invoice_idx" ON "sepa_batch_item" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "sepa_mandate_org_idx" ON "sepa_mandate" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sepa_mandate_member_idx" ON "sepa_mandate" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "sepa_mandate_contract_idx" ON "sepa_mandate" USING btree ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sepa_mandate_active_unique_idx" ON "sepa_mandate" USING btree ("contract_id") WHERE "sepa_mandate"."is_active" = true;--> statement-breakpoint
CREATE INDEX "inventory_product_org_idx" ON "inventory_product" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "inventory_product_created_at_idx" ON "inventory_product" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inventory_product_attribute_product_idx" ON "inventory_product_attribute" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_product_attribute_value_attribute_idx" ON "inventory_product_attribute_value" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "inventory_variant_product_idx" ON "inventory_variant" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "club_member_org_id_idx" ON "club_member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "group_member_group_id_idx" ON "group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_member_member_id_idx" ON "group_member" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "group_member_group_member_idx" ON "group_member" USING btree ("group_id","member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_member_active_unique_idx" ON "group_member" USING btree ("group_id","member_id") WHERE "group_member"."end_date" IS NULL;--> statement-breakpoint
CREATE INDEX "group_member_range_idx" ON "group_member" USING btree ("group_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "self_registration_org_id_idx" ON "self_registration" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "self_registration_active_idx" ON "self_registration" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "self_registration_submitted_idx" ON "self_registration" USING btree ("submitted");--> statement-breakpoint
CREATE INDEX "self_registration_member_id_idx" ON "self_registration" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "self_registration_status_idx" ON "self_registration" USING btree ("status");
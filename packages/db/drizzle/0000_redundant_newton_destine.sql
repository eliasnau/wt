CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE IF EXISTS "group"
	ADD COLUMN IF NOT EXISTS "default_membership_price_cents" integer;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'group'
			AND column_name = 'default_membership_price'
	) THEN
		EXECUTE '
			UPDATE "group"
			SET "default_membership_price_cents" = ROUND("default_membership_price"::numeric * 100)::integer
			WHERE "default_membership_price" IS NOT NULL
				AND "default_membership_price_cents" IS NULL
		';

		EXECUTE 'ALTER TABLE "group" DROP COLUMN "default_membership_price"';
	END IF;
END $$;

ALTER TABLE IF EXISTS "group_member"
	ADD COLUMN IF NOT EXISTS "membership_price_cents" integer;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'group_member'
			AND column_name = 'membership_price'
	) THEN
		EXECUTE '
			UPDATE "group_member"
			SET "membership_price_cents" = ROUND("membership_price"::numeric * 100)::integer
			WHERE "membership_price_cents" IS NULL
		';

		EXECUTE 'ALTER TABLE "group_member" DROP COLUMN "membership_price"';
	END IF;
END $$;

UPDATE "group_member"
SET "membership_price_cents" = 0
WHERE "membership_price_cents" IS NULL;

ALTER TABLE IF EXISTS "group_member"
	ALTER COLUMN "membership_price_cents" SET DEFAULT 0;

ALTER TABLE IF EXISTS "group_member"
	ALTER COLUMN "membership_price_cents" SET NOT NULL;

ALTER TABLE IF EXISTS "self_registration"
	ADD COLUMN IF NOT EXISTS "joining_fee_cents" integer,
	ADD COLUMN IF NOT EXISTS "yearly_fee_cents" integer;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'self_registration'
			AND column_name = 'joining_fee_amount'
	) THEN
		EXECUTE '
			UPDATE "self_registration"
			SET "joining_fee_cents" = ROUND("joining_fee_amount"::numeric * 100)::integer
			WHERE "joining_fee_amount" IS NOT NULL
				AND "joining_fee_cents" IS NULL
		';

		EXECUTE 'ALTER TABLE "self_registration" DROP COLUMN "joining_fee_amount"';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'self_registration'
			AND column_name = 'yearly_fee_amount'
	) THEN
		EXECUTE '
			UPDATE "self_registration"
			SET "yearly_fee_cents" = ROUND("yearly_fee_amount"::numeric * 100)::integer
			WHERE "yearly_fee_amount" IS NOT NULL
				AND "yearly_fee_cents" IS NULL
		';

		EXECUTE 'ALTER TABLE "self_registration" DROP COLUMN "yearly_fee_amount"';
	END IF;
END $$;

UPDATE "self_registration"
SET "groups_snapshot" = (
	SELECT COALESCE(
		jsonb_agg(
			CASE
				WHEN jsonb_typeof(entry.value) = 'object'
					AND entry.value ? 'monthlyFee'
					AND NOT (entry.value ? 'monthlyFeeCents')
					AND (entry.value->>'monthlyFee') ~ '^[0-9]+(\.[0-9]{1,2})?$'
				THEN (entry.value - 'monthlyFee')
					|| jsonb_build_object(
						'monthlyFeeCents',
						ROUND((entry.value->>'monthlyFee')::numeric * 100)::integer
					)
				ELSE entry.value
			END
		),
		'[]'::jsonb
	)
	FROM jsonb_array_elements("groups_snapshot") AS entry(value)
)
WHERE jsonb_typeof("groups_snapshot") = 'array';

ALTER TABLE IF EXISTS "contract"
	DROP CONSTRAINT IF EXISTS "contract_member_unique";

ALTER TABLE IF EXISTS "contract"
	DROP CONSTRAINT IF EXISTS "contract_mandate_id_unique";

DROP INDEX IF EXISTS "contract_next_billing_idx";

ALTER TABLE IF EXISTS "contract"
	ADD COLUMN IF NOT EXISTS "status" text,
	ADD COLUMN IF NOT EXISTS "cancellation_notice_days" integer DEFAULT 0,
	ADD COLUMN IF NOT EXISTS "yearly_fee_mode" text DEFAULT 'january',
	ADD COLUMN IF NOT EXISTS "settled_through_date" date,
	ADD COLUMN IF NOT EXISTS "joining_fee_cents" integer,
	ADD COLUMN IF NOT EXISTS "yearly_fee_cents" integer,
	ADD COLUMN IF NOT EXISTS "cancellation_reason" text;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'contract'
			AND column_name = 'joining_fee_amount'
	) THEN
		EXECUTE '
			UPDATE "contract"
			SET "joining_fee_cents" = ROUND("joining_fee_amount"::numeric * 100)::integer
			WHERE "joining_fee_amount" IS NOT NULL
				AND "joining_fee_cents" IS NULL
		';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'contract'
			AND column_name = 'yearly_fee_amount'
	) THEN
		EXECUTE '
			UPDATE "contract"
			SET "yearly_fee_cents" = ROUND("yearly_fee_amount"::numeric * 100)::integer
			WHERE "yearly_fee_amount" IS NOT NULL
				AND "yearly_fee_cents" IS NULL
		';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'contract'
			AND column_name = 'cancel_reason'
	) THEN
		EXECUTE '
			UPDATE "contract"
			SET "cancellation_reason" = "cancel_reason"
			WHERE "cancel_reason" IS NOT NULL
				AND "cancellation_reason" IS NULL
		';
	END IF;
END $$;

UPDATE "contract"
SET "status" = CASE
	WHEN "cancellation_effective_date" IS NOT NULL
		AND "cancellation_effective_date" < CURRENT_DATE THEN 'ended'
	WHEN "cancelled_at" IS NOT NULL
		OR "cancellation_effective_date" IS NOT NULL THEN 'cancelled'
	ELSE 'active'
END
WHERE "status" IS NULL;

UPDATE "contract"
SET "yearly_fee_mode" = 'january'
WHERE "yearly_fee_mode" IS NULL;

UPDATE "contract"
SET "cancellation_notice_days" = 0
WHERE "cancellation_notice_days" IS NULL;

ALTER TABLE IF EXISTS "contract"
	ALTER COLUMN "status" SET DEFAULT 'active';

ALTER TABLE IF EXISTS "contract"
	ALTER COLUMN "status" SET NOT NULL;

ALTER TABLE IF EXISTS "contract"
	ALTER COLUMN "yearly_fee_mode" SET DEFAULT 'january';

ALTER TABLE IF EXISTS "contract"
	ALTER COLUMN "yearly_fee_mode" SET NOT NULL;

ALTER TABLE IF EXISTS "contract"
	ALTER COLUMN "cancellation_notice_days" SET DEFAULT 0;

ALTER TABLE IF EXISTS "contract"
	ALTER COLUMN "cancellation_notice_days" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "sepa_mandate" (
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
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "credit_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"type" text NOT NULL,
	"original_amount_cents" integer,
	"remaining_amount_cents" integer,
	"original_cycles" integer,
	"remaining_cycles" integer,
	"valid_from" date,
	"expires_at" date,
	"description" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"billing_period_start" date NOT NULL,
	"billing_period_end" date NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"void_reason" text,
	"replaced_by_invoice_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finalized_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoice_line" (
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

CREATE TABLE IF NOT EXISTS "sepa_batch" (
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
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sepa_batch_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"sepa_batch_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"sepa_mandate_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'included' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
	IF to_regclass('public.payment') IS NOT NULL AND to_regclass('public.payment_batch') IS NOT NULL THEN
		INSERT INTO "sepa_batch" (
			"id",
			"organization_id",
			"collection_date",
			"sequence_number",
			"batch_number",
			"status",
			"total_amount_cents",
			"transaction_count",
			"notes",
			"created_at",
			"generated_at",
			"updated_at"
		)
		SELECT
			pb."id",
			pb."organization_id",
			pb."billing_month",
			1,
			COALESCE(pb."batch_number", pb."billing_month"::text || '-01-' || upper(left(pb."organization_id", 8))),
			'downloaded',
			ROUND(COALESCE(pb."total_amount", 0)::numeric * 100)::integer,
			COALESCE(pb."transaction_count", 0),
			pb."notes",
			pb."created_at",
			pb."created_at",
			pb."updated_at"
		FROM "payment_batch" pb
		LEFT JOIN "sepa_batch" sb ON sb."id" = pb."id"
		WHERE sb."id" IS NULL;

		INSERT INTO "invoice" (
			"id",
			"organization_id",
			"member_id",
			"contract_id",
			"billing_period_start",
			"billing_period_end",
			"due_date",
			"status",
			"currency",
			"total_cents",
			"created_at",
			"finalized_at",
			"updated_at"
		)
		SELECT
			p."id",
			c."organization_id",
			c."member_id",
			p."contract_id",
			p."billing_period_start",
			p."billing_period_end",
			p."due_date",
			'finalized',
			'EUR',
			ROUND(p."total_amount"::numeric * 100)::integer,
			p."created_at",
			p."created_at",
			p."updated_at"
		FROM "payment" p
		INNER JOIN "contract" c ON c."id" = p."contract_id"
		LEFT JOIN "invoice" i ON i."id" = p."id"
		WHERE i."id" IS NULL;

		INSERT INTO "invoice_line" (
			"organization_id",
			"invoice_id",
			"type",
			"description",
			"quantity",
			"unit_amount_cents",
			"total_amount_cents",
			"coverage_start",
			"coverage_end",
			"created_at"
		)
		SELECT
			c."organization_id",
			p."id",
			'membership_fee',
			'Migrated membership fee',
			1,
			ROUND(p."membership_amount"::numeric * 100)::integer,
			ROUND(p."membership_amount"::numeric * 100)::integer,
			p."billing_period_start",
			p."billing_period_end",
			p."created_at"
		FROM "payment" p
		INNER JOIN "contract" c ON c."id" = p."contract_id"
		WHERE COALESCE(p."membership_amount", 0) <> 0
			AND NOT EXISTS (
				SELECT 1
				FROM "invoice_line" il
				WHERE il."invoice_id" = p."id"
					AND il."type" = 'membership_fee'
			);

		INSERT INTO "invoice_line" (
			"organization_id",
			"invoice_id",
			"type",
			"description",
			"quantity",
			"unit_amount_cents",
			"total_amount_cents",
			"coverage_start",
			"coverage_end",
			"created_at"
		)
		SELECT
			c."organization_id",
			p."id",
			'joining_fee',
			'Migrated joining fee',
			1,
			ROUND(p."joining_fee_amount"::numeric * 100)::integer,
			ROUND(p."joining_fee_amount"::numeric * 100)::integer,
			p."billing_period_start",
			p."billing_period_end",
			p."created_at"
		FROM "payment" p
		INNER JOIN "contract" c ON c."id" = p."contract_id"
		WHERE COALESCE(p."joining_fee_amount", 0) <> 0
			AND NOT EXISTS (
				SELECT 1
				FROM "invoice_line" il
				WHERE il."invoice_id" = p."id"
					AND il."type" = 'joining_fee'
			);

		INSERT INTO "invoice_line" (
			"organization_id",
			"invoice_id",
			"type",
			"description",
			"quantity",
			"unit_amount_cents",
			"total_amount_cents",
			"coverage_start",
			"coverage_end",
			"created_at"
		)
		SELECT
			c."organization_id",
			p."id",
			'yearly_fee',
			'Migrated yearly fee',
			1,
			ROUND(p."yearly_fee_amount"::numeric * 100)::integer,
			ROUND(p."yearly_fee_amount"::numeric * 100)::integer,
			p."billing_period_start",
			p."billing_period_end",
			p."created_at"
		FROM "payment" p
		INNER JOIN "contract" c ON c."id" = p."contract_id"
		WHERE COALESCE(p."yearly_fee_amount", 0) <> 0
			AND NOT EXISTS (
				SELECT 1
				FROM "invoice_line" il
				WHERE il."invoice_id" = p."id"
					AND il."type" = 'yearly_fee'
			);
	END IF;
END $$;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'contract'
			AND column_name = 'mandate_id'
	) THEN
		INSERT INTO "sepa_mandate" (
			"organization_id",
			"member_id",
			"contract_id",
			"mandate_reference",
			"account_holder",
			"iban",
			"bic",
			"signature_date",
			"is_active",
			"created_at",
			"updated_at"
		)
		SELECT
			c."organization_id",
			c."member_id",
			c."id",
			c."mandate_id",
			m."card_holder",
			m."iban",
			m."bic",
			c."mandate_signature_date",
			true,
			c."created_at",
			c."updated_at"
		FROM "contract" c
		INNER JOIN "club_member" m ON m."id" = c."member_id"
		LEFT JOIN "sepa_mandate" sm ON sm."contract_id" = c."id"
		WHERE c."mandate_id" IS NOT NULL
			AND sm."id" IS NULL;
	END IF;
END $$;

DO $$
BEGIN
	IF to_regclass('public.payment') IS NOT NULL THEN
		INSERT INTO "sepa_batch_item" (
			"organization_id",
			"sepa_batch_id",
			"invoice_id",
			"sepa_mandate_id",
			"amount_cents",
			"status",
			"created_at"
		)
		SELECT
			c."organization_id",
			p."batch_id",
			p."id",
			sm."id",
			ROUND(p."total_amount"::numeric * 100)::integer,
			'included',
			p."created_at"
		FROM "payment" p
		INNER JOIN "contract" c ON c."id" = p."contract_id"
		INNER JOIN "sepa_mandate" sm ON sm."contract_id" = c."id"
		LEFT JOIN "sepa_batch_item" sbi
			ON sbi."sepa_batch_id" = p."batch_id"
			AND sbi."invoice_id" = p."id"
		WHERE sbi."id" IS NULL;
	END IF;
END $$;

UPDATE "contract"
SET "settled_through_date" = DATE '2026-03-31';

ALTER TABLE IF EXISTS "contract"
	DROP COLUMN IF EXISTS "current_period_end_date",
	DROP COLUMN IF EXISTS "next_billing_date",
	DROP COLUMN IF EXISTS "mandate_id",
	DROP COLUMN IF EXISTS "mandate_signature_date",
	DROP COLUMN IF EXISTS "joining_fee_amount",
	DROP COLUMN IF EXISTS "yearly_fee_amount",
	DROP COLUMN IF EXISTS "joining_fee_paid_at",
	DROP COLUMN IF EXISTS "last_yearly_fee_paid_year",
	DROP COLUMN IF EXISTS "cancel_reason";

DROP TABLE IF EXISTS "payment";
DROP TABLE IF EXISTS "payment_batch";

ALTER TABLE "contract"
	DROP CONSTRAINT IF EXISTS "contract_member_id_club_member_id_fk";

ALTER TABLE "contract"
	DROP CONSTRAINT IF EXISTS "contract_organization_id_organization_id_fk";

ALTER TABLE "contract"
	ADD CONSTRAINT "contract_member_id_club_member_id_fk"
		FOREIGN KEY ("member_id") REFERENCES "club_member"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "contract"
	ADD CONSTRAINT "contract_organization_id_organization_id_fk"
		FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "sepa_mandate"
	DROP CONSTRAINT IF EXISTS "sepa_mandate_organization_id_organization_id_fk";
ALTER TABLE "sepa_mandate"
	DROP CONSTRAINT IF EXISTS "sepa_mandate_member_id_club_member_id_fk";
ALTER TABLE "sepa_mandate"
	DROP CONSTRAINT IF EXISTS "sepa_mandate_contract_id_contract_id_fk";
ALTER TABLE "credit_grant"
	DROP CONSTRAINT IF EXISTS "credit_grant_organization_id_organization_id_fk";
ALTER TABLE "credit_grant"
	DROP CONSTRAINT IF EXISTS "credit_grant_member_id_club_member_id_fk";
ALTER TABLE "credit_grant"
	DROP CONSTRAINT IF EXISTS "credit_grant_contract_id_contract_id_fk";
ALTER TABLE "invoice"
	DROP CONSTRAINT IF EXISTS "invoice_organization_id_organization_id_fk";
ALTER TABLE "invoice"
	DROP CONSTRAINT IF EXISTS "invoice_member_id_club_member_id_fk";
ALTER TABLE "invoice"
	DROP CONSTRAINT IF EXISTS "invoice_contract_id_contract_id_fk";
ALTER TABLE "invoice_line"
	DROP CONSTRAINT IF EXISTS "invoice_line_organization_id_organization_id_fk";
ALTER TABLE "invoice_line"
	DROP CONSTRAINT IF EXISTS "invoice_line_invoice_id_invoice_id_fk";
ALTER TABLE "invoice_line"
	DROP CONSTRAINT IF EXISTS "invoice_line_group_id_group_id_fk";
ALTER TABLE "invoice_line"
	DROP CONSTRAINT IF EXISTS "invoice_line_credit_grant_id_credit_grant_id_fk";
ALTER TABLE "sepa_batch"
	DROP CONSTRAINT IF EXISTS "sepa_batch_organization_id_organization_id_fk";
ALTER TABLE "sepa_batch_item"
	DROP CONSTRAINT IF EXISTS "sepa_batch_item_organization_id_organization_id_fk";
ALTER TABLE "sepa_batch_item"
	DROP CONSTRAINT IF EXISTS "sepa_batch_item_sepa_batch_id_sepa_batch_id_fk";
ALTER TABLE "sepa_batch_item"
	DROP CONSTRAINT IF EXISTS "sepa_batch_item_invoice_id_invoice_id_fk";
ALTER TABLE "sepa_batch_item"
	DROP CONSTRAINT IF EXISTS "sepa_batch_item_sepa_mandate_id_sepa_mandate_id_fk";

ALTER TABLE "sepa_mandate"
	ADD CONSTRAINT "sepa_mandate_organization_id_organization_id_fk"
		FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "sepa_mandate"
	ADD CONSTRAINT "sepa_mandate_member_id_club_member_id_fk"
		FOREIGN KEY ("member_id") REFERENCES "club_member"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "sepa_mandate"
	ADD CONSTRAINT "sepa_mandate_contract_id_contract_id_fk"
		FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "credit_grant"
	ADD CONSTRAINT "credit_grant_organization_id_organization_id_fk"
		FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "credit_grant"
	ADD CONSTRAINT "credit_grant_member_id_club_member_id_fk"
		FOREIGN KEY ("member_id") REFERENCES "club_member"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "credit_grant"
	ADD CONSTRAINT "credit_grant_contract_id_contract_id_fk"
		FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "invoice"
	ADD CONSTRAINT "invoice_organization_id_organization_id_fk"
		FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "invoice"
	ADD CONSTRAINT "invoice_member_id_club_member_id_fk"
		FOREIGN KEY ("member_id") REFERENCES "club_member"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "invoice"
	ADD CONSTRAINT "invoice_contract_id_contract_id_fk"
		FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "invoice_line"
	ADD CONSTRAINT "invoice_line_organization_id_organization_id_fk"
		FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "invoice_line"
	ADD CONSTRAINT "invoice_line_invoice_id_invoice_id_fk"
		FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "invoice_line"
	ADD CONSTRAINT "invoice_line_group_id_group_id_fk"
		FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "invoice_line"
	ADD CONSTRAINT "invoice_line_credit_grant_id_credit_grant_id_fk"
		FOREIGN KEY ("credit_grant_id") REFERENCES "credit_grant"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "sepa_batch"
	ADD CONSTRAINT "sepa_batch_organization_id_organization_id_fk"
		FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "sepa_batch_item"
	ADD CONSTRAINT "sepa_batch_item_organization_id_organization_id_fk"
		FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "sepa_batch_item"
	ADD CONSTRAINT "sepa_batch_item_sepa_batch_id_sepa_batch_id_fk"
		FOREIGN KEY ("sepa_batch_id") REFERENCES "sepa_batch"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "sepa_batch_item"
	ADD CONSTRAINT "sepa_batch_item_invoice_id_invoice_id_fk"
		FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "sepa_batch_item"
	ADD CONSTRAINT "sepa_batch_item_sepa_mandate_id_sepa_mandate_id_fk"
		FOREIGN KEY ("sepa_mandate_id") REFERENCES "sepa_mandate"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE IF EXISTS "invoice"
	ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE IF EXISTS "sepa_batch"
	ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS "contract_member_id_idx" ON "contract" USING btree ("member_id");
CREATE INDEX IF NOT EXISTS "contract_org_id_idx" ON "contract" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "sepa_mandate_org_idx" ON "sepa_mandate" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "sepa_mandate_member_idx" ON "sepa_mandate" USING btree ("member_id");
CREATE INDEX IF NOT EXISTS "sepa_mandate_contract_idx" ON "sepa_mandate" USING btree ("contract_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sepa_mandate_reference_unique" ON "sepa_mandate" USING btree ("mandate_reference");
CREATE INDEX IF NOT EXISTS "credit_grant_org_idx" ON "credit_grant" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "credit_grant_member_idx" ON "credit_grant" USING btree ("member_id");
CREATE INDEX IF NOT EXISTS "credit_grant_contract_idx" ON "credit_grant" USING btree ("contract_id");
CREATE INDEX IF NOT EXISTS "invoice_org_idx" ON "invoice" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "invoice_member_idx" ON "invoice" USING btree ("member_id");
CREATE INDEX IF NOT EXISTS "invoice_contract_idx" ON "invoice" USING btree ("contract_id");
CREATE INDEX IF NOT EXISTS "invoice_due_date_idx" ON "invoice" USING btree ("due_date");
CREATE INDEX IF NOT EXISTS "invoice_period_idx" ON "invoice" USING btree ("contract_id", "billing_period_start");
CREATE INDEX IF NOT EXISTS "invoice_line_org_idx" ON "invoice_line" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "invoice_line_invoice_idx" ON "invoice_line" USING btree ("invoice_id");
CREATE INDEX IF NOT EXISTS "invoice_line_group_idx" ON "invoice_line" USING btree ("group_id");
CREATE INDEX IF NOT EXISTS "invoice_line_credit_grant_idx" ON "invoice_line" USING btree ("credit_grant_id");
CREATE INDEX IF NOT EXISTS "sepa_batch_org_idx" ON "sepa_batch" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "sepa_batch_collection_date_idx" ON "sepa_batch" USING btree ("collection_date");
CREATE UNIQUE INDEX IF NOT EXISTS "sepa_batch_org_collection_sequence_unique" ON "sepa_batch" USING btree ("organization_id", "collection_date", "sequence_number");
CREATE INDEX IF NOT EXISTS "sepa_batch_item_org_idx" ON "sepa_batch_item" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "sepa_batch_item_batch_idx" ON "sepa_batch_item" USING btree ("sepa_batch_id");
CREATE INDEX IF NOT EXISTS "sepa_batch_item_invoice_idx" ON "sepa_batch_item" USING btree ("invoice_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sepa_batch_item_batch_invoice_unique" ON "sepa_batch_item" USING btree ("sepa_batch_id", "invoice_id");

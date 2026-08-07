CREATE TABLE "coaching_appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"coach_user_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"location" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"price_cents" integer,
	"payment_status" text DEFAULT 'open' NOT NULL,
	"notes" text,
	"cancellation_reason" text,
	"attendance_recorded_at" timestamp,
	"attendance_recorded_by_user_id" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coaching_appointment_time_order" CHECK ("coaching_appointment"."end_time" > "coaching_appointment"."start_time"),
	CONSTRAINT "coaching_appointment_price_nonnegative" CHECK ("coaching_appointment"."price_cents" IS NULL OR "coaching_appointment"."price_cents" >= 0),
	CONSTRAINT "coaching_appointment_status" CHECK ("coaching_appointment"."status" IN ('scheduled', 'attended', 'no_show', 'cancelled')),
	CONSTRAINT "coaching_appointment_payment_status" CHECK ("coaching_appointment"."payment_status" IN ('open', 'paid', 'waived'))
);
--> statement-breakpoint
CREATE TABLE "coaching_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"member_id" uuid,
	"guest_name" text,
	"guest_email" text,
	"guest_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coaching_participant_identity" CHECK (num_nonnulls("coaching_participant"."member_id", "coaching_participant"."guest_name") = 1)
);
--> statement-breakpoint
ALTER TABLE "coaching_appointment" ADD CONSTRAINT "coaching_appointment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_appointment" ADD CONSTRAINT "coaching_appointment_coach_user_id_user_id_fk" FOREIGN KEY ("coach_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_appointment" ADD CONSTRAINT "coaching_appointment_attendance_recorded_by_user_id_user_id_fk" FOREIGN KEY ("attendance_recorded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_appointment" ADD CONSTRAINT "coaching_appointment_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_participant" ADD CONSTRAINT "coaching_participant_appointment_id_coaching_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."coaching_appointment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_participant" ADD CONSTRAINT "coaching_participant_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coaching_appointment_org_date_idx" ON "coaching_appointment" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "coaching_appointment_coach_date_idx" ON "coaching_appointment" USING btree ("coach_user_id","date");--> statement-breakpoint
CREATE INDEX "coaching_participant_appointment_idx" ON "coaching_participant" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "coaching_participant_member_idx" ON "coaching_participant" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coaching_participant_member_unique_idx" ON "coaching_participant" USING btree ("appointment_id","member_id") WHERE "coaching_participant"."member_id" IS NOT NULL;
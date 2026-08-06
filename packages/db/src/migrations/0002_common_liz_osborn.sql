CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"location" text,
	"price_cents" integer,
	"capacity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_price_nonnegative" CHECK ("event"."price_cents" IS NULL OR "event"."price_cents" >= 0),
	CONSTRAINT "event_capacity_nonnegative" CHECK ("event"."capacity" IS NULL OR "event"."capacity" >= 0),
	CONSTRAINT "event_time_pair" CHECK (("event"."start_time" IS NULL AND "event"."end_time" IS NULL) OR ("event"."start_time" IS NOT NULL AND "event"."end_time" IS NOT NULL)),
	CONSTRAINT "event_time_order" CHECK ("event"."start_time" IS NULL OR "event"."end_time" > "event"."start_time")
);
--> statement-breakpoint
CREATE TABLE "event_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"member_id" uuid,
	"guest_name" text,
	"status" text DEFAULT 'registered' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_participant_identity" CHECK (num_nonnulls("event_participant"."member_id", "event_participant"."guest_name") = 1),
	CONSTRAINT "event_participant_status" CHECK ("event_participant"."status" IN ('registered', 'attended', 'no_show', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_org_date_idx" ON "event" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "event_participant_event_status_idx" ON "event_participant" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_participant_member_idx" ON "event_participant" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_participant_active_member_unique_idx" ON "event_participant" USING btree ("event_id","member_id") WHERE "event_participant"."member_id" IS NOT NULL AND "event_participant"."status" <> 'cancelled';
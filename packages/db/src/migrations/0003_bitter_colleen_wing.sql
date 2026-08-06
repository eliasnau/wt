CREATE TABLE "member_rank" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" uuid NOT NULL,
	"progression_system_id" uuid NOT NULL,
	"progression_rank_id" uuid NOT NULL,
	"event_id" uuid,
	"awarded_on" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progression_rank" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"progression_system_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progression_system" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"unit_label" text DEFAULT 'Graduierung' NOT NULL,
	"mode" text DEFAULT 'sequential' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "progression_system_mode" CHECK ("progression_system"."mode" IN ('sequential', 'collection'))
);
--> statement-breakpoint
ALTER TABLE "group" ADD COLUMN "progression_system_id" uuid;--> statement-breakpoint
ALTER TABLE "member_rank" ADD CONSTRAINT "member_rank_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_rank" ADD CONSTRAINT "member_rank_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_rank" ADD CONSTRAINT "member_rank_progression_system_id_progression_system_id_fk" FOREIGN KEY ("progression_system_id") REFERENCES "public"."progression_system"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_rank" ADD CONSTRAINT "member_rank_progression_rank_id_progression_rank_id_fk" FOREIGN KEY ("progression_rank_id") REFERENCES "public"."progression_rank"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_rank" ADD CONSTRAINT "member_rank_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_rank" ADD CONSTRAINT "progression_rank_progression_system_id_progression_system_id_fk" FOREIGN KEY ("progression_system_id") REFERENCES "public"."progression_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_system" ADD CONSTRAINT "progression_system_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_rank_org_member_idx" ON "member_rank" USING btree ("organization_id","member_id");--> statement-breakpoint
CREATE INDEX "member_rank_system_idx" ON "member_rank" USING btree ("progression_system_id");--> statement-breakpoint
CREATE INDEX "member_rank_rank_idx" ON "member_rank" USING btree ("progression_rank_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_rank_member_rank_unique_idx" ON "member_rank" USING btree ("member_id","progression_rank_id");--> statement-breakpoint
CREATE INDEX "progression_rank_system_idx" ON "progression_rank" USING btree ("progression_system_id");--> statement-breakpoint
CREATE UNIQUE INDEX "progression_rank_system_order_unique_idx" ON "progression_rank" USING btree ("progression_system_id","sort_order");--> statement-breakpoint
CREATE INDEX "progression_system_org_idx" ON "progression_system" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "group" ADD CONSTRAINT "group_progression_system_id_progression_system_id_fk" FOREIGN KEY ("progression_system_id") REFERENCES "public"."progression_system"("id") ON DELETE set null ON UPDATE no action;
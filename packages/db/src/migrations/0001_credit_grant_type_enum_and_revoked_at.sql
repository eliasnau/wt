-- Hand-added pre-flight (not generated): the cast below aborts on any value
-- outside the enum. Fail with an actionable message naming the row count
-- instead of a bare "invalid input value for enum" from the ALTER.
DO $$
DECLARE bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count
    FROM "credit_grant"
   WHERE "type" NOT IN ('money', 'billing_cycles');
  IF bad_count > 0 THEN
    RAISE EXCEPTION
      'credit_grant.type holds % row(s) outside (money, billing_cycles). Clean those rows, then re-run this migration.',
      bad_count;
  END IF;
END $$;--> statement-breakpoint
CREATE TYPE "public"."credit_grant_type" AS ENUM('money', 'billing_cycles');--> statement-breakpoint
ALTER TABLE "credit_grant" ALTER COLUMN "type" SET DATA TYPE "public"."credit_grant_type" USING "type"::"public"."credit_grant_type";--> statement-breakpoint
ALTER TABLE "credit_grant" ADD COLUMN "revoked_at" timestamp;
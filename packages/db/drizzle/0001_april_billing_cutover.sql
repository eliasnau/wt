-- Remove billing test data so production starts clean on the new invoice flow.
DELETE FROM "sepa_batch_item";
DELETE FROM "invoice_line";
DELETE FROM "invoice";
DELETE FROM "sepa_batch";

-- Clean up any legacy payment test data if those tables still exist for any reason.
DO $$
BEGIN
	IF to_regclass('public.payment') IS NOT NULL THEN
		DELETE FROM "payment";
	END IF;

	IF to_regclass('public.payment_batch') IS NOT NULL THEN
		DELETE FROM "payment_batch";
	END IF;
END $$;

-- April 2026 was collected in the old system, so contracts that had already
-- started by 2026-04-01 must be treated as settled through 2026-04-30.
-- Joining fee rule for the cutover:
-- - contracts starting before 2026-04-01 still owe the joining fee
-- - contracts starting on or after 2026-04-01 have already paid it
UPDATE "contract"
SET
	"settled_through_date" = CASE
		WHEN "start_date" <= DATE '2026-04-01' THEN DATE '2026-04-30'
		ELSE NULL
	END,
	"joining_fee_paid" = CASE
		WHEN "start_date" < DATE '2026-04-01' THEN false
		ELSE true
	END,
	"updated_at" = NOW()
WHERE
	"settled_through_date" IS DISTINCT FROM CASE
		WHEN "start_date" <= DATE '2026-04-01' THEN DATE '2026-04-30'
		ELSE NULL
	END
	OR "joining_fee_paid" IS DISTINCT FROM CASE
		WHEN "start_date" < DATE '2026-04-01' THEN false
		ELSE true
	END;

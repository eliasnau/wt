DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "contract"
		GROUP BY "member_id"
		HAVING COUNT(*) > 1
	) THEN
		RAISE EXCEPTION
			'Cannot restore contract_member_unique: duplicate contracts already exist for one or more members';
	END IF;
END $$;

ALTER TABLE "contract" ADD CONSTRAINT "contract_member_unique" UNIQUE("member_id");

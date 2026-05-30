import { and, db, eq } from "@matdesk/db";
import { contract } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { ymdInBerlin } from "../../domain/members/cancellation";
import { membersErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";

const ACTIVE_CONTRACT_STATUSES = new Set(["active", "cancelled"]);

const input = z.object({
  memberId: z.uuid(),
  joiningFeeCents: z.number().int().nonnegative().optional(),
  yearlyFeeCents: z.number().int().nonnegative().optional(),
});

export const updateMemberContract = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ member: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const today = ymdInBerlin(new Date());

    // `contract_member_unique` constrains one contract per member — no
    // ordering needed.
    const [row] = await db
      .select({
        id: contract.id,
        status: contract.status,
        cancellationEffectiveDate: contract.cancellationEffectiveDate,
        joiningFeePaid: contract.joiningFeePaid,
      })
      .from(contract)
      .where(
        and(
          eq(contract.memberId, input.memberId),
          eq(contract.organizationId, context.organizationId),
        ),
      )
      .limit(1);

    if (!row) {
      throw membersErrors.CONTRACT_NOT_FOUND({
        internal: { memberId: input.memberId },
      });
    }

    const isCurrent =
      ACTIVE_CONTRACT_STATUSES.has(row.status) &&
      (!row.cancellationEffectiveDate || row.cancellationEffectiveDate >= today);

    if (!isCurrent) {
      throw membersErrors.CONTRACT_NOT_ACTIVE({
        internal: { contractId: row.id, status: row.status },
      });
    }

    // The billing engine flips `joiningFeePaid` to true the moment the fee
    // lands on an invoice. Once that happens the amount is locked — voiding
    // the invoice flips it back and lets the caller change the fee again.
    if (input.joiningFeeCents !== undefined && row.joiningFeePaid) {
      throw membersErrors.JOINING_FEE_ALREADY_BILLED({
        internal: { contractId: row.id },
      });
    }

    // TODO(billing): gate `yearlyFeeCents` the same way once we port billing —
    // see REWRITE_TODO.md → "Gate yearly fee updates after billing".

    const [updated] = await db
      .update(contract)
      .set({
        joiningFeeCents: input.joiningFeeCents,
        yearlyFeeCents: input.yearlyFeeCents,
      })
      .where(
        and(
          eq(contract.id, row.id),
          eq(contract.organizationId, context.organizationId),
        ),
      )
      .returning();

    if (!updated) {
      throw createError({
        message: "Couldn't update contract",
        status: 500,
        internal: { reason: "UPDATE contract returned no row" },
      });
    }

    context.log?.set({
      data: {
        member: { id: input.memberId },
        contract: { id: updated.id },
      },
    });
    return updated;
  })
  .route({ method: "PATCH", path: "/members/:memberId/contract" });

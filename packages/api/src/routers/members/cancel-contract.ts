import { and, db, eq, isNull } from "@matdesk/db";
import { contract } from "@matdesk/db/schema";
import { z } from "zod";

import {
  validateCancellationDate,
  ymdInBerlin,
  type CancellationViolation,
} from "../../domain/members/cancellation";
import { membersErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { databaseIdSchema } from "../../schemas";
import { ymdSchema } from "./schemas";

const input = z.object({
  memberId: databaseIdSchema,
  cancelReason: z.string().trim().min(1, "Cancel reason is required").max(1000),
  cancellationEffectiveDate: ymdSchema,
});

const VIOLATION_TO_ERROR: Record<CancellationViolation, () => Error> = {
  INVALID_DATE: () => membersErrors.CANCELLATION_DATE_INVALID(),
  NOT_LAST_DAY: () => membersErrors.CANCELLATION_DATE_NOT_LAST_DAY(),
  IN_PAST: () => membersErrors.CANCELLATION_DATE_IN_PAST(),
  BEFORE_INITIAL_PERIOD: () => membersErrors.CANCELLATION_BEFORE_INITIAL_PERIOD(),
};

export const cancelMemberContract = orgProcedure
  .meta({ cost: 10 })
  .use(requirePermission({ member: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const [existing] = await db
      .select()
      .from(contract)
      .where(
        and(
          eq(contract.memberId, input.memberId),
          eq(contract.organizationId, context.organizationId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw membersErrors.CONTRACT_NOT_FOUND({
        internal: { memberId: input.memberId },
      });
    }
    if (existing.cancelledAt) {
      throw membersErrors.CONTRACT_ALREADY_CANCELLED({
        internal: { contractId: existing.id },
      });
    }

    const violation = validateCancellationDate(input.cancellationEffectiveDate, {
      today: ymdInBerlin(new Date()),
      initialPeriodEndDate: existing.initialPeriodEndDate,
    });
    if (violation) throw VIOLATION_TO_ERROR[violation]();

    const [updated] = await db
      .update(contract)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: input.cancelReason,
        cancellationEffectiveDate: input.cancellationEffectiveDate,
      })
      .where(and(eq(contract.id, existing.id), isNull(contract.cancelledAt)))
      .returning();

    if (!updated) {
      // Lost a race — another request cancelled this contract first.
      throw membersErrors.CONTRACT_ALREADY_CANCELLED({
        internal: { contractId: existing.id, reason: "lost-race" },
      });
    }

    context.log?.set({
      data: {
        member: { id: input.memberId },
        contract: {
          id: updated.id,
          cancellationEffectiveDate: updated.cancellationEffectiveDate,
        },
      },
    });
    return updated;
  })
  .route({ method: "POST", path: "/members/:memberId/cancel-contract" });

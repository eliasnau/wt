import { and, db, eq, isNull } from "@matdesk/db";
import { creditGrant } from "@matdesk/db/schema";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { idInput } from "./schemas";

/**
 * Withdraw a credit grant so it stops being allocated on future invoices.
 *
 * Deliberately *not* a delete: `invoice_line` rows reference the grant for every
 * cent/cycle already consumed, so removing the row would orphan finalized
 * invoice history (and the FK is `restrict` anyway). Revoking is the inverse of
 * `createCreditGrant` for grants that were issued in error — already-applied
 * credit stays applied, and nothing further is drawn.
 *
 * Mirrors `revokeSepaMandate`, except there's no `isActive` companion column:
 * `revokedAt IS NULL` *is* the active predicate (see `loadActiveCreditGrants`).
 */
export const revokeCreditGrant = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ members: ["update"] }))
  .input(idInput)
  .handler(async ({ input, context }) => {
    // Guarded UPDATE: `revoked_at IS NULL` makes this idempotency-safe under
    // concurrent calls — the second one matches no row. Pre-fetching only to
    // tell "not found" apart from "already revoked" for a useful error.
    const [updated] = await db
      .update(creditGrant)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(creditGrant.id, input.id),
          eq(creditGrant.organizationId, context.organizationId),
          isNull(creditGrant.revokedAt),
        ),
      )
      .returning();

    if (!updated) {
      const existing = await db
        .select({ revokedAt: creditGrant.revokedAt })
        .from(creditGrant)
        .where(
          and(eq(creditGrant.id, input.id), eq(creditGrant.organizationId, context.organizationId)),
        );
      if (existing[0]?.revokedAt) {
        throw billingErrors.CREDIT_GRANT_ALREADY_REVOKED({
          internal: { grantId: input.id, revokedAt: existing[0].revokedAt },
        });
      }
      throw billingErrors.CREDIT_GRANT_NOT_FOUND({
        internal: { grantId: input.id, organizationId: context.organizationId },
      });
    }

    context.log?.set({
      data: { creditGrant: { id: updated.id, revoked: true, type: updated.type } },
    });
    return updated;
  })
  .route({ method: "POST", path: "/billing/credit-grants/:id/revoke" });

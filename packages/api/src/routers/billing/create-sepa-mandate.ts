import { and, db, eq } from "@matdesk/db";
import { sepaMandate } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { normalizeSepaIdentifier, validateIban } from "../../integrations/sepa";
import { requirePermission } from "../../middlewares/permissions";
import { acquireContractMandateLock, ensureOwnedMemberContract } from "../../queries/billing";
import { ymdSchema } from "./schemas";

const input = z.object({
  memberId: z.uuid(),
  contractId: z.uuid(),
  mandateReference: z.string().min(1).max(35),
  accountHolder: z.string().min(1).max(255),
  iban: z.string().trim().min(1).max(34),
  bic: z.string().trim().min(1).max(11),
  signatureDate: ymdSchema,
});

/**
 * Create a new active mandate for a contract, deactivating any prior active one
 * — all in a single transaction so a contract never has two active mandates.
 */
export const createSepaMandate = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ sepa: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    if (!(await validateIban(input.iban))) {
      throw billingErrors.INVALID_IBAN({ internal: { reason: "mandate iban" } });
    }

    const created = await db.transaction(async (tx) => {
      // Serialize mandate changes for this contract so two concurrent creates
      // can't both deactivate the old row and insert a new active one.
      await acquireContractMandateLock(tx, input.contractId);

      const owned = await ensureOwnedMemberContract(
        tx,
        context.organizationId,
        input.memberId,
        input.contractId,
      );
      if (!owned) {
        throw billingErrors.MEMBER_OR_CONTRACT_NOT_FOUND({
          internal: { memberId: input.memberId, contractId: input.contractId },
        });
      }

      await tx
        .update(sepaMandate)
        .set({ isActive: false, revokedAt: new Date() })
        .where(
          and(
            eq(sepaMandate.organizationId, context.organizationId),
            eq(sepaMandate.contractId, input.contractId),
            eq(sepaMandate.isActive, true),
          ),
        );

      const [row] = await tx
        .insert(sepaMandate)
        .values({
          organizationId: context.organizationId,
          memberId: input.memberId,
          contractId: input.contractId,
          mandateReference: input.mandateReference,
          accountHolder: input.accountHolder,
          iban: normalizeSepaIdentifier(input.iban),
          bic: normalizeSepaIdentifier(input.bic),
          signatureDate: input.signatureDate,
          isActive: true,
        })
        .returning();
      if (!row) {
        throw createError({
          message: "Couldn't create SEPA mandate",
          status: 500,
          internal: { reason: "INSERT sepa_mandate returned no row" },
        });
      }
      return row;
    });

    context.log?.set({ data: { mandate: { id: created.id } } });
    return created;
  })
  .route({ method: "POST", path: "/billing/sepa-mandates" });

import { db } from "@matdesk/db";
import { creditGrant } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { billingErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { ensureOwnedMemberContract } from "../../queries/billing";
import { creditGrantTypeSchema, ymdSchema } from "./schemas";

const input = z
  .object({
    memberId: z.uuid(),
    contractId: z.uuid(),
    type: creditGrantTypeSchema,
    description: z.string().max(255).optional(),
    notes: z.string().max(1000).optional(),
    validFrom: ymdSchema.optional(),
    expiresAt: ymdSchema.optional(),
    originalAmountCents: z.number().int().nonnegative().optional(),
    originalCycles: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "money" && value.originalAmountCents === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "originalAmountCents is required for money credits",
        path: ["originalAmountCents"],
      });
    }
    if (value.type === "billing_cycles" && value.originalCycles === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "originalCycles is required for billing cycle credits",
        path: ["originalCycles"],
      });
    }
  });

export const createCreditGrant = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ member: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const owned = await ensureOwnedMemberContract(
      db,
      context.organizationId,
      input.memberId,
      input.contractId,
    );
    if (!owned) {
      throw billingErrors.MEMBER_OR_CONTRACT_NOT_FOUND({
        internal: { memberId: input.memberId, contractId: input.contractId },
      });
    }

    const [created] = await db
      .insert(creditGrant)
      .values({
        organizationId: context.organizationId,
        memberId: input.memberId,
        contractId: input.contractId,
        type: input.type,
        originalAmountCents: input.originalAmountCents,
        remainingAmountCents: input.originalAmountCents,
        originalCycles: input.originalCycles,
        remainingCycles: input.originalCycles,
        validFrom: input.validFrom,
        expiresAt: input.expiresAt,
        description: input.description,
        notes: input.notes,
      })
      .returning();
    if (!created) {
      throw createError({
        message: "Couldn't create credit grant",
        status: 500,
        internal: { reason: "INSERT credit_grant returned no row" },
      });
    }

    context.log?.set({ data: { creditGrant: { id: created.id, type: created.type } } });
    return created;
  })
  .route({ method: "POST", path: "/billing/credit-grants" });

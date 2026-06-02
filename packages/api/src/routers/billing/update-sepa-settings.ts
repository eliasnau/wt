import { db, eq } from "@matdesk/db";
import { organizationSettings } from "@matdesk/db/schema";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { assertValidCreditorSettings, normalizeSepaIdentifier } from "../../integrations/sepa";
import { requirePermission } from "../../middlewares/permissions";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v === "" ? null : v));

const input = z.object({
  creditorName: optionalText(140),
  creditorIban: optionalText(34),
  creditorBic: optionalText(11),
  creditorId: optionalText(35),
  initiatorName: optionalText(140),
  batchBooking: z.boolean().optional(),
  remittanceMembership: optionalText(140),
  remittanceJoiningFee: optionalText(140),
  remittanceYearlyFee: optionalText(140),
});

/**
 * Upsert the org's SEPA creditor settings. Creditor IBAN/BIC/creditor-id are
 * checksum-validated (when present) before saving, so an invalid creditor can
 * never reach the XML export path. `undefined` fields are left unchanged; an
 * explicit `null`/empty string clears a field.
 */
export const updateSepaSettings = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ sepa: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    // Store identifiers in canonical form (no spaces, uppercase) so validation
    // here and at export time always agree.
    const normalized = {
      ...input,
      creditorIban: input.creditorIban
        ? normalizeSepaIdentifier(input.creditorIban)
        : input.creditorIban,
      creditorBic: input.creditorBic
        ? normalizeSepaIdentifier(input.creditorBic)
        : input.creditorBic,
      creditorId: input.creditorId ? normalizeSepaIdentifier(input.creditorId) : input.creditorId,
    };

    await assertValidCreditorSettings({
      creditorIban: normalized.creditorIban,
      creditorBic: normalized.creditorBic,
      creditorId: normalized.creditorId,
    });

    // Only the keys the caller actually sent — `undefined` means "no change".
    const patch = Object.fromEntries(Object.entries(normalized).filter(([, v]) => v !== undefined));

    // Nothing to change → ensure a row exists and return current settings.
    if (Object.keys(patch).length === 0) {
      const [existing] = await db
        .insert(organizationSettings)
        .values({ organizationId: context.organizationId })
        .onConflictDoNothing()
        .returning();
      if (existing) return existing;
      const [current] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, context.organizationId))
        .limit(1);
      return current;
    }

    const [row] = await db
      .insert(organizationSettings)
      .values({ organizationId: context.organizationId, ...patch })
      .onConflictDoUpdate({
        target: organizationSettings.organizationId,
        set: patch,
      })
      .returning();

    context.log?.set({ data: { sepaSettings: { organizationId: context.organizationId } } });
    return row;
  })
  .route({ method: "PATCH", path: "/billing/sepa-settings" });

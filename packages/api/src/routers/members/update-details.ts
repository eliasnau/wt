import { and, db, eq } from "@matdesk/db";
import { clubMember } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { addressAffectsGeocode } from "../../domain/members/address";
import { geocodeAddress } from "../../integrations/geocoding";
import { membersErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getMemberById } from "../../queries/members";
import { databaseIdSchema } from "../../schemas";
import { addressSchema, optionalEmail, optionalPhone, optionalYmdSchema } from "./schemas";

const input = addressSchema.extend({
  memberId: databaseIdSchema,
  firstName: z.string().trim().min(1, "First name is required").max(255),
  lastName: z.string().trim().min(1, "Last name is required").max(255),
  birthdate: optionalYmdSchema,
  email: optionalEmail,
  phone: optionalPhone,
});

export const updateMemberDetails = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ member: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const existing = await getMemberById(input.memberId, context.organizationId);
    if (!existing) {
      throw membersErrors.NOT_FOUND({
        internal: {
          memberId: input.memberId,
          organizationId: context.organizationId,
        },
      });
    }

    // Re-geocode only when an address field that affects the lookup changed —
    // avoids a network round-trip (and rate-limit pressure) on every edit.
    const addressChanged = addressAffectsGeocode(existing, input);

    // Geocode before the UPDATE (fails soft to `null`). When the address changed
    // but the lookup failed we deliberately write `null` for both coordinates:
    // stale coordinates pointing at the member's *previous* address are worse
    // than no pin at all.
    const geo = addressChanged
      ? await geocodeAddress(
          {
            street: input.street,
            postalCode: input.postalCode,
            city: input.city,
            country: input.country,
          },
          context.log,
        )
      : null;

    const [updated] = await db
      .update(clubMember)
      .set({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        birthdate: input.birthdate,
        street: input.street,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        // Only touch the coordinates when the address actually changed —
        // otherwise the columns stay out of the `set` entirely so an existing
        // pin (e.g. from a back-fill) survives a plain name/email edit.
        ...(addressChanged
          ? { latitude: geo?.latitude ?? null, longitude: geo?.longitude ?? null }
          : {}),
      })
      .where(
        and(
          eq(clubMember.id, input.memberId),
          eq(clubMember.organizationId, context.organizationId),
        ),
      )
      .returning();

    if (!updated) {
      throw createError({
        message: "Couldn't update member",
        status: 500,
        internal: { reason: "UPDATE clubMember returned no row" },
      });
    }

    context.log?.set({
      data: {
        member: { id: updated.id },
        // `ok` only when a lookup actually ran — a bare `ok: false` on every
        // name-only edit would skew any geocode-failure-rate query.
        geocoding: {
          changed: addressChanged,
          ...(addressChanged ? { ok: geo !== null } : {}),
        },
      },
    });
    return updated;
  })
  .route({ method: "PATCH", path: "/members/:memberId/details" });

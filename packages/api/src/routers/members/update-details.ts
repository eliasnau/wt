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
import {
  addressSchema,
  optionalEmail,
  optionalPhone,
  optionalYmdSchema,
} from "./schemas";

const input = addressSchema.extend({
  memberId: z.uuid(),
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
    const existing = await getMemberById(
      input.memberId,
      context.organizationId,
    );
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
    // Done before the UPDATE so the call doesn't hold a DB connection.
    const addressChanged = addressAffectsGeocode(existing, input);
    const geo = addressChanged
      ? await geocodeAddress({
          street: input.street,
          postalCode: input.postalCode,
          city: input.city,
          country: input.country,
        })
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
        // Only overwrite coordinates when we re-geocoded; otherwise leave the
        // stored lat/lng untouched.
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
        geocoding: { changed: addressChanged, ok: geo !== null },
      },
    });
    return updated;
  })
  .route({ method: "PATCH", path: "/members/:memberId/details" });

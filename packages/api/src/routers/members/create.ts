import { and, db, eq, inArray } from "@matdesk/db";
import { clubMember, contract, group, groupMember, sepaMandate } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { ymdInBerlin } from "../../domain/members/cancellation";
import { calculateInitialPeriodEndDate } from "../../domain/members/contract";
import { generateMandateReference } from "../../domain/members/mandate-ref";
import { geocodeAddress } from "../../integrations/geocoding";
import { validateIban } from "../../integrations/sepa";
import { groupsErrors, membersErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import {
  addressSchema,
  bicSchema,
  ibanSchema,
  initialPeriodSchema,
  monthStartSchema,
  optionalEmail,
  optionalPhone,
  optionalYmdSchema,
  yearlyFeeModeSchema,
} from "./schemas";

const optionalNotes = z
  .string()
  .max(1000)
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalShortText = z
  .string()
  .trim()
  .max(255)
  .optional()
  .transform((v) => (v ? v : undefined));

const input = addressSchema.extend({
  firstName: z.string().trim().min(1, "First name is required").max(255),
  lastName: z.string().trim().min(1, "Last name is required").max(255),
  birthdate: optionalYmdSchema,
  email: optionalEmail,
  phone: optionalPhone,

  iban: ibanSchema,
  bic: bicSchema,
  cardHolder: z.string().trim().min(1, "Card holder name is required").max(255),

  contractStartDate: monthStartSchema,
  initialPeriod: initialPeriodSchema,
  joiningFeeCents: z.number().int().nonnegative().optional(),
  yearlyFeeCents: z.number().int().nonnegative().optional(),
  yearlyFeeMode: yearlyFeeModeSchema.optional(),
  settledThroughDate: optionalYmdSchema,

  memberNotes: optionalNotes,
  contractNotes: optionalNotes,

  guardianName: optionalShortText,
  guardianEmail: optionalEmail,
  guardianPhone: optionalPhone,

  // Groups to assign on creation. Price defaults to the group's default when
  // omitted; an empty/omitted array assigns none.
  groups: z
    .array(
      z.object({
        groupId: z.uuid(),
        membershipPriceCents: z.number().int().nonnegative().optional(),
      }),
    )
    .optional(),
});

export const createMember = orgProcedure
  .meta({ cost: 10 })
  .use(requirePermission({ member: ["create"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    if (!(await validateIban(input.iban))) {
      throw membersErrors.INVALID_IBAN({ internal: { reason: "member iban" } });
    }

    const initialPeriodEndDate = calculateInitialPeriodEndDate(
      input.contractStartDate,
      input.initialPeriod,
    );
    const signatureDate = ymdInBerlin(new Date());
    const mandateReference = generateMandateReference();

    // Geocode before opening the transaction — never hold a tx open across a
    // network call. Fails soft to `null` (the member just has no map pin).
    const geo = await geocodeAddress(
      {
        street: input.street,
        postalCode: input.postalCode,
        city: input.city,
        country: input.country,
      },
      context.log,
    );

    const result = await db.transaction(async (tx) => {
      const [member] = await tx
        .insert(clubMember)
        .values({
          organizationId: context.organizationId,
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
          // Resolved above; null when the address couldn't be geocoded — the
          // member is created either way, just without a map pin.
          latitude: geo?.latitude ?? null,
          longitude: geo?.longitude ?? null,
          iban: input.iban,
          bic: input.bic,
          cardHolder: input.cardHolder,
          notes: input.memberNotes,
          guardianName: input.guardianName,
          guardianEmail: input.guardianEmail,
          guardianPhone: input.guardianPhone,
        })
        .returning();
      if (!member) {
        throw createError({
          message: "Couldn't create member",
          status: 500,
          internal: { reason: "INSERT clubMember returned no row" },
        });
      }

      const [newContract] = await tx
        .insert(contract)
        .values({
          organizationId: context.organizationId,
          memberId: member.id,
          initialPeriod: input.initialPeriod,
          startDate: input.contractStartDate,
          initialPeriodEndDate,
          yearlyFeeMode: input.yearlyFeeMode ?? "january",
          joiningFeeCents: input.joiningFeeCents,
          yearlyFeeCents: input.yearlyFeeCents,
          settledThroughDate: input.settledThroughDate,
          notes: input.contractNotes,
        })
        .returning();
      if (!newContract) {
        throw createError({
          message: "Couldn't create contract",
          status: 500,
          internal: { reason: "INSERT contract returned no row" },
        });
      }

      const [mandate] = await tx
        .insert(sepaMandate)
        .values({
          organizationId: context.organizationId,
          memberId: member.id,
          contractId: newContract.id,
          mandateReference,
          accountHolder: input.cardHolder,
          iban: input.iban,
          bic: input.bic,
          signatureDate,
          isActive: true,
        })
        .returning();
      if (!mandate) {
        throw createError({
          message: "Couldn't create SEPA mandate",
          status: 500,
          internal: { reason: "INSERT sepaMandate returned no row" },
        });
      }

      // Assign requested groups. Validate they belong to the org, then insert
      // one membership per group using the provided price (falling back to the
      // group's default). Last entry wins for any duplicate groupId.
      const priceByGroupId = new Map(
        (input.groups ?? []).map((g) => [g.groupId, g.membershipPriceCents]),
      );
      const uniqueGroupIds = [...priceByGroupId.keys()];
      if (uniqueGroupIds.length > 0) {
        const groups = await tx
          .select({
            id: group.id,
            defaultPriceCents: group.defaultMembershipPriceCents,
          })
          .from(group)
          .where(
            and(
              eq(group.organizationId, context.organizationId),
              inArray(group.id, uniqueGroupIds),
            ),
          );

        if (groups.length !== uniqueGroupIds.length) {
          const found = new Set(groups.map((g) => g.id));
          const missing = uniqueGroupIds.find((id) => !found.has(id));
          throw groupsErrors.NOT_FOUND({ internal: { groupId: missing } });
        }

        await tx.insert(groupMember).values(
          groups.map((g) => ({
            memberId: member.id,
            groupId: g.id,
            membershipPriceCents:
              priceByGroupId.get(g.id) ?? g.defaultPriceCents ?? 0,
            startDate: signatureDate,
          })),
        );
      }

      return { member, contract: newContract, sepaMandate: mandate };
    });

    context.log?.set({
      data: {
        member: { id: result.member.id },
        contract: { id: result.contract.id },
        mandate: { reference: result.sepaMandate.mandateReference },
        geocoding: { ok: geo !== null },
      },
    });
    return result;
  })
  .route({ method: "POST", path: "/members" });

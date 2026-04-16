import { ORPCError } from "@orpc/server";
import { and, db, eq } from "@repo/db";
import { DB } from "@repo/db/functions";
import { clubMember } from "@repo/db/schema";
import { z } from "zod";
import { geocodeAddress } from "../../lib/geocoding";

export const updateMemberDetailsSchema = z.object({
	memberId: z.string().uuid(),
	firstName: z.string().trim().min(1).max(255),
	lastName: z.string().trim().min(1).max(255),
	birthdate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)")
		.optional()
		.or(z.literal("")),
	email: z.string().trim().email("Invalid email address").or(z.string().trim().length(0)),
	phone: z.string().trim().max(255, "Phone is too long"),
	street: z.string().trim().min(1).max(255),
	city: z.string().trim().min(1).max(255),
	state: z.string().trim().min(1).max(255),
	postalCode: z.string().trim().min(1).max(255),
	country: z.string().trim().min(1).max(255),
});

function normalizeOptionalText(
	value: string | null | undefined,
): string | undefined {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}

export async function updateMemberDetails({
	organizationId,
	...input
}: z.infer<typeof updateMemberDetailsSchema> & {
	organizationId: string;
}) {
	const [existingMember] = await db
		.select({
			street: clubMember.street,
			city: clubMember.city,
			state: clubMember.state,
			postalCode: clubMember.postalCode,
			country: clubMember.country,
			latitude: clubMember.latitude,
			longitude: clubMember.longitude,
		})
		.from(clubMember)
		.where(
			and(
				eq(clubMember.id, input.memberId),
				eq(clubMember.organizationId, organizationId),
			),
		)
		.limit(1);

	if (!existingMember) {
		throw new ORPCError("NOT_FOUND", {
			message: "Member not found",
		});
	}

	const addressChanged =
		existingMember.street !== input.street ||
		existingMember.city !== input.city ||
		existingMember.state !== input.state ||
		existingMember.postalCode !== input.postalCode ||
		existingMember.country !== input.country;

	const geocodedAddress = addressChanged
		? await geocodeAddress({
				street: input.street,
				postalCode: input.postalCode,
				city: input.city,
				country: input.country,
			})
		: {
				latitude: existingMember.latitude,
				longitude: existingMember.longitude,
			};

	return DB.mutation.members.updateMember({
		memberId: input.memberId,
		organizationId,
		memberData: {
			firstName: input.firstName,
			lastName: input.lastName,
			email: normalizeOptionalText(input.email) ?? null,
			phone: normalizeOptionalText(input.phone) ?? null,
			birthdate: normalizeOptionalText(input.birthdate),
			street: input.street,
			city: input.city,
			state: input.state,
			postalCode: input.postalCode,
			country: input.country,
			latitude: geocodedAddress?.latitude ?? null,
			longitude: geocodedAddress?.longitude ?? null,
		},
		contractData: {},
	});
}

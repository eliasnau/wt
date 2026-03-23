import { ORPCError } from "@orpc/server";
import { and, db, eq, sql } from "@repo/db";
import { clubMember } from "@repo/db/schema";
import { after } from "next/server";
import { z } from "zod";
import { protectedProcedure } from "../../index";
import { geocodeAddress } from "../../lib/geocoding";
import { logger } from "../../lib/logger";
import { getPostHogServer } from "../../lib/posthog";
import { requirePermission } from "../../middleware/permissions";
import { rateLimitMiddleware } from "../../middleware/ratelimit";

export const reGeocodeOrganizationSchema = z.object({
	organizationId: z.string().min(1),
});

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const reGeocodeOrganizationProcedure = protectedProcedure
	.use(rateLimitMiddleware(1))
	.use(requirePermission({ member: ["update"] }))
	.input(reGeocodeOrganizationSchema)
	.handler(async ({ input, context }) => {
		const organizationId = context.session.activeOrganizationId!;
		const posthog = getPostHogServer();

		if (input.organizationId !== organizationId) {
			throw new ORPCError("FORBIDDEN", {
				message: "Entered organization id must match the active organization",
			});
		}

		try {
			const membersWithAddress = await db
				.select({
					memberId: clubMember.id,
					street: clubMember.street,
					postalCode: clubMember.postalCode,
					city: clubMember.city,
					country: clubMember.country,
				})
				.from(clubMember)
				.where(
					and(
						eq(clubMember.organizationId, organizationId),
						sql`${clubMember.street} <> ''`,
						sql`${clubMember.postalCode} <> ''`,
						sql`${clubMember.city} <> ''`,
						sql`${clubMember.country} <> ''`,
					),
				);

			let updatedCount = 0;
			let failedCount = 0;
			const failures: string[] = [];

			for (const member of membersWithAddress) {
				const geocodedAddress = await geocodeAddress({
					street: member.street,
					postalCode: member.postalCode,
					city: member.city,
					country: member.country,
				}).catch(() => null);

				if (!geocodedAddress) {
					failedCount += 1;
					failures.push(member.memberId);
					await delay(1100);
					continue;
				}

				await db
					.update(clubMember)
					.set({
						latitude: geocodedAddress.latitude,
						longitude: geocodedAddress.longitude,
					})
					.where(
						and(
							eq(clubMember.id, member.memberId),
							eq(clubMember.organizationId, organizationId),
						),
					);

				updatedCount += 1;
				await delay(1100);
			}

			posthog.capture({
				distinctId: context.userId,
				event: "members:re-geocode-organization",
				groups: {
					organization: organizationId,
				},
				properties: {
					organization_id: organizationId,
					updated_count: updatedCount,
					failed_count: failedCount,
					total_count: membersWithAddress.length,
				},
			});

			after(() => posthog.shutdown());

			return {
				organizationId,
				totalCount: membersWithAddress.length,
				updatedCount,
				failedCount,
				failures,
			};
		} catch (error) {
			logger.error("Failed to re-geocode organization members", {
				error,
				organizationId,
				userId: context.user.id,
			});

			after(() => posthog.shutdown());

			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to recalculate member addresses",
			});
		}
	})
	.route({ method: "POST", path: "/members/re-geocode-organization" });

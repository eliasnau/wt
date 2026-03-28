import { ORPCError } from "@orpc/server";
import { and, db, eq } from "@repo/db";
import { contract } from "@repo/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../index";
import { requirePermission } from "../../middleware/permissions";
import { rateLimitMiddleware } from "../../middleware/ratelimit";

export const updateMemberContractSchema = z.object({
	memberId: z.string().uuid(),
	joiningFeeCents: z.number().int().nonnegative().optional(),
	yearlyFeeCents: z.number().int().nonnegative().optional(),
});

export const updateMemberContractProcedure = protectedProcedure
	.use(rateLimitMiddleware(5))
	.use(requirePermission({ member: ["update"] }))
	.input(updateMemberContractSchema)
	.handler(async ({ input, context }) => {
		const organizationId = context.session.activeOrganizationId!;

		const [updatedContract] = await db
			.update(contract)
			.set({
				joiningFeeCents: input.joiningFeeCents,
				yearlyFeeCents: input.yearlyFeeCents,
			})
			.where(
				and(
					eq(contract.memberId, input.memberId),
					eq(contract.organizationId, organizationId),
				),
			)
			.returning();

		if (!updatedContract) {
			throw new ORPCError("NOT_FOUND", {
				message: "Contract not found",
			});
		}

		return updatedContract;
	})
	.route({ method: "PATCH", path: "/members/:memberId/contract" });

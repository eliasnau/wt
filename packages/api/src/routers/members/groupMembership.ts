import { ORPCError } from "@orpc/server";
import { DB } from "@repo/db/functions";
import { z } from "zod";

export const assignGroupSchema = z.object({
	memberId: z.string(),
	groupId: z.string(),
	membershipPriceCents: z.number().int().nonnegative().optional(),
});

export const updateGroupMembershipSchema = z.object({
	memberId: z.string(),
	groupId: z.string(),
	membershipPriceCents: z.number().int().nonnegative().nullable(),
});

export const removeGroupMembershipSchema = z.object({
	memberId: z.string(),
	groupId: z.string(),
});

async function ensureMemberAndGroup({
	organizationId,
	memberId,
	groupId,
}: {
	organizationId: string;
	memberId: string;
	groupId: string;
}) {
	const [member, group] = await Promise.all([
		DB.query.members.getMemberById({ id: memberId }),
		DB.query.groups.getGroupById({ groupId }),
	]);

	if (!member || member.organizationId !== organizationId) {
		throw new ORPCError("NOT_FOUND", { message: "Member not found" });
	}

	if (!group || group.organizationId !== organizationId) {
		throw new ORPCError("NOT_FOUND", { message: "Group not found" });
	}

	return { member, group };
}

export async function assignMemberToGroup({
	organizationId,
	memberId,
	groupId,
	membershipPriceCents,
}: z.infer<typeof assignGroupSchema> & {
	organizationId: string;
}) {
	const { group } = await ensureMemberAndGroup({
		organizationId,
		memberId,
		groupId,
	});

	try {
		const result = await DB.mutation.groups.assignMemberToGroup({
			memberId,
			groupId,
			membershipPriceCents,
		});

		if (!result) {
			throw new Error("Failed to assign member to group");
		}

		return { result, group };
	} catch (error) {
		if ((error as { code?: string }).code === "23505") {
			throw new ORPCError("BAD_REQUEST", {
				message: "Member is already in this group",
			});
		}

		throw error;
	}
}

export async function updateMemberGroupMembership({
	organizationId,
	memberId,
	groupId,
	membershipPriceCents,
}: z.infer<typeof updateGroupMembershipSchema> & {
	organizationId: string;
}) {
	const { group } = await ensureMemberAndGroup({
		organizationId,
		memberId,
		groupId,
	});

	const result = await DB.mutation.groups.updateGroupMember({
		memberId,
		groupId,
		membershipPriceCents: membershipPriceCents ?? null,
	});

	if (!result) {
		throw new ORPCError("NOT_FOUND", {
			message: "Membership not found",
		});
	}

	return { result, group };
}

export async function removeMemberGroupMembership({
	organizationId,
	memberId,
	groupId,
}: z.infer<typeof removeGroupMembershipSchema> & {
	organizationId: string;
}) {
	const { group } = await ensureMemberAndGroup({
		organizationId,
		memberId,
		groupId,
	});

	const result = await DB.mutation.groups.removeMemberFromGroup({
		memberId,
		groupId,
	});

	if (!result) {
		throw new ORPCError("NOT_FOUND", {
			message: "Membership not found",
		});
	}

	return { result, group };
}

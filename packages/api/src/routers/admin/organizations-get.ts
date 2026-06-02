import { and, count, db, eq, isNull } from "@matdesk/db";
import {
  clubMember,
  contract,
  group,
  member,
  organization,
  user,
} from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const getOrganizationAdmin = adminProcedure
  .meta({ cost: 2 })
  .input(z.object({ organizationId: z.string().min(1) }))
  .handler(async ({ input }) => {
    const org = await db
      .select()
      .from(organization)
      .where(eq(organization.id, input.organizationId))
      .then((r) => r[0]);

    if (!org) {
      throw createError({ message: "Organisation nicht gefunden", status: 404 });
    }

    const [rows, totalMembersRow, activeMembersRow, groupsRow] = await Promise.all([
      db
        .select({ member, user })
        .from(member)
        .innerJoin(user, eq(user.id, member.userId))
        .where(eq(member.organizationId, input.organizationId)),
      // Aggregate stats only — no private member data is returned.
      db
        .select({ count: count() })
        .from(clubMember)
        .where(eq(clubMember.organizationId, input.organizationId))
        .then((r) => r[0]),
      db
        .select({ count: count() })
        .from(clubMember)
        .innerJoin(contract, eq(contract.memberId, clubMember.id))
        .where(
          and(eq(clubMember.organizationId, input.organizationId), isNull(contract.cancelledAt)),
        )
        .then((r) => r[0]),
      db
        .select({ count: count() })
        .from(group)
        .where(eq(group.organizationId, input.organizationId))
        .then((r) => r[0]),
    ]);

    return {
      ...org,
      stats: {
        totalMembers: totalMembersRow?.count ?? 0,
        activeMembers: activeMembersRow?.count ?? 0,
        groups: groupsRow?.count ?? 0,
        team: rows.length,
      },
      members: rows.map((row) => ({
        id: row.member.id,
        userId: row.member.userId,
        role: row.member.role,
        createdAt: row.member.createdAt,
        user: {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
          image: row.user.image,
        },
      })),
    };
  })
  .route({ method: "POST", path: "/admin/organizations/get" });

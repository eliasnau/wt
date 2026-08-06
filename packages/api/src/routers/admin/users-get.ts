import { and, count, db, desc, eq, gt } from "@matdesk/db";
import { member, organization, session, user } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const getUserAdmin = adminProcedure
  .meta({ cost: 2 })
  .input(z.object({ userId: z.string().min(1) }))
  .handler(async ({ input }) => {
    const now = new Date();

    const foundUser = await db
      .select()
      .from(user)
      .where(eq(user.id, input.userId))
      .then((r) => r[0]);

    if (!foundUser) {
      throw createError({ message: "Benutzer nicht gefunden", status: 404 });
    }

    const [organizationRows, activeSessions, totalSessionsRow] = await Promise.all([
      db
        .select({ member, organization })
        .from(member)
        .innerJoin(organization, eq(organization.id, member.organizationId))
        .where(eq(member.userId, input.userId))
        .orderBy(desc(member.createdAt)),
      db
        .select({
          id: session.id,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          activeOrganizationId: session.activeOrganizationId,
          impersonatedBy: session.impersonatedBy,
        })
        .from(session)
        .where(and(eq(session.userId, input.userId), gt(session.expiresAt, now)))
        .orderBy(desc(session.updatedAt)),
      db
        .select({ count: count() })
        .from(session)
        .where(eq(session.userId, input.userId))
        .then((r) => r[0]),
    ]);

    return {
      user: foundUser,
      stats: {
        organizations: organizationRows.length,
        activeSessions: activeSessions.length,
        totalSessions: totalSessionsRow?.count ?? 0,
        twoFactorEnabled: Boolean(foundUser.twoFactorEnabled),
      },
      organizations: organizationRows.map((row) => ({
        id: row.organization.id,
        name: row.organization.name,
        slug: row.organization.slug,
        logo: row.organization.logo,
        role: row.member.role,
        joinedAt: row.member.createdAt,
      })),
      activeSessions,
    };
  })
  .route({ method: "POST", path: "/admin/users/get" });

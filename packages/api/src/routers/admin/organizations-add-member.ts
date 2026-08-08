import { roles as organizationRoles } from "@matdesk/auth/permissions";
import { and, db, eq } from "@matdesk/db";
import { member, user } from "@matdesk/db/schema";
import { createError } from "evlog";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { adminProcedure } from "../../index";

const ROLE_VALUES = Object.keys(organizationRoles) as [string, ...string[]];

const input = z.object({
  organizationId: z.string().min(1),
  email: z.email(),
  role: z.enum(ROLE_VALUES).default("staff"),
});

/**
 * Add an existing user (looked up by email) to an organization directly. The
 * org plugin's client has no `addMember`; this is the platform-admin path.
 */
export const addOrganizationMemberAdmin = adminProcedure
  .meta({ cost: 3 })
  .input(input)
  .handler(async ({ input }) => {
    const targetUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, input.email))
      .then((r) => r[0]);

    if (!targetUser) {
      throw createError({ message: "Kein Benutzer mit dieser E-Mail gefunden", status: 404 });
    }

    const existing = await db
      .select({ id: member.id })
      .from(member)
      .where(and(eq(member.organizationId, input.organizationId), eq(member.userId, targetUser.id)))
      .then((r) => r[0]);

    if (existing) {
      throw createError({ message: "Benutzer ist bereits Mitglied", status: 409 });
    }

    const [created] = await db
      .insert(member)
      .values({
        id: randomUUID(),
        organizationId: input.organizationId,
        userId: targetUser.id,
        role: input.role,
      })
      .returning();

    return created;
  })
  .route({ method: "POST", path: "/admin/organizations/add-member" });

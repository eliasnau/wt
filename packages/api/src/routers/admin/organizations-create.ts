import { db, eq } from "@matdesk/db";
import { organization } from "@matdesk/db/schema";
import { createError } from "evlog";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { adminProcedure } from "../../index";

const input = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten"),
});

/**
 * Create an organization as a platform admin — WITHOUT adding the admin as a
 * member (a direct insert, unlike better-auth's `organization.create` which
 * makes the caller the owner).
 */
export const createOrganizationAdmin = adminProcedure
  .meta({ cost: 5 })
  .input(input)
  .handler(async ({ input }) => {
    const existing = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, input.slug))
      .then((r) => r[0]);

    if (existing) {
      throw createError({ message: "Slug bereits vergeben", status: 409 });
    }

    const [created] = await db
      .insert(organization)
      .values({ id: randomUUID(), name: input.name, slug: input.slug })
      .returning();

    if (!created) {
      throw createError({ message: "Organisation konnte nicht erstellt werden", status: 500 });
    }

    return created;
  })
  .route({ method: "POST", path: "/admin/organizations/create" });

import { db, eq } from "@matdesk/db";
import { organizationSettings } from "@matdesk/db/schema";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";

export const getSepaSettings = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ sepa: ["view"] }))
  .input(z.object({}))
  .handler(async ({ context }) => {
    const [row] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, context.organizationId))
      .limit(1);
    return row ?? null;
  })
  .route({ method: "GET", path: "/billing/sepa-settings" });

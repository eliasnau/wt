import { db, eq } from "@matdesk/db";
import { group } from "@matdesk/db/schema";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";

export const listGroups = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ groups: ["view"] }))
  .handler(({ context }) =>
    db
      .select()
      .from(group)
      .where(eq(group.organizationId, context.organizationId)),
  )
  .route({ method: "GET", path: "/groups" });

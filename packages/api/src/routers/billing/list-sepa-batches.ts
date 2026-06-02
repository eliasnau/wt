import { db, desc, eq } from "@matdesk/db";
import { sepaBatch } from "@matdesk/db/schema";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";

export const listSepaBatches = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ billing: ["view"] }))
  .input(z.object({}))
  .handler(({ context }) =>
    db
      .select()
      .from(sepaBatch)
      .where(eq(sepaBatch.organizationId, context.organizationId))
      .orderBy(desc(sepaBatch.createdAt)),
  )
  .route({ method: "GET", path: "/billing/sepa-batches" });

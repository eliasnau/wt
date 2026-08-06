import { db } from "@matdesk/db";
import { event } from "@matdesk/db/schema";
import { createError } from "evlog";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { eventFieldsSchema } from "./schemas";

export const createEvent = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ events: ["create"] }))
  .input(eventFieldsSchema)
  .handler(async ({ input, context }) => {
    const [created] = await db
      .insert(event)
      .values({ ...input, organizationId: context.organizationId })
      .returning();
    if (!created) throw createError({ message: "Couldn't create event", status: 500 });
    context.log?.set({ data: { event: { id: created.id, name: created.name } } });
    return created;
  })
  .route({ method: "POST", path: "/events" });

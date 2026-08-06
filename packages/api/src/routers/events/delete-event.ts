import { and, db, eq } from "@matdesk/db";
import { event } from "@matdesk/db/schema";

import { eventsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { eventIdInput } from "./schemas";

export const deleteEvent = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ events: ["delete"] }))
  .input(eventIdInput)
  .handler(async ({ input, context }) => {
    const [deleted] = await db
      .delete(event)
      .where(and(eq(event.id, input.eventId), eq(event.organizationId, context.organizationId)))
      .returning();
    if (!deleted) throw eventsErrors.NOT_FOUND({ internal: input });
    context.log?.set({ data: { event: { id: deleted.id, name: deleted.name } } });
    return deleted;
  })
  .route({ method: "DELETE", path: "/events/:eventId" });

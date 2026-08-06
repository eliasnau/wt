import { and, db, eq } from "@matdesk/db";
import { event } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { eventsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getEventById } from "../../queries/events";
import { eventFieldsSchema } from "./schemas";

const inputSchema = eventFieldsSchema.extend({
  eventId: z.string().trim().min(1),
});

export const updateEvent = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ events: ["update"] }))
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const { eventId, ...values } = input;
    if (!(await getEventById(eventId, context.organizationId))) {
      throw eventsErrors.NOT_FOUND({ internal: { eventId } });
    }
    const [updated] = await db
      .update(event)
      .set(values)
      .where(and(eq(event.id, eventId), eq(event.organizationId, context.organizationId)))
      .returning();
    if (!updated) throw createError({ message: "Couldn't update event", status: 500 });
    context.log?.set({ data: { event: { id: updated.id, name: updated.name } } });
    return updated;
  })
  .route({ method: "PATCH", path: "/events/:eventId" });

import { eventsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getEventWithParticipants } from "../../queries/events";
import { eventIdInput } from "./schemas";

export const getEvent = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ events: ["view"] }))
  .input(eventIdInput)
  .handler(async ({ input, context }) => {
    const found = await getEventWithParticipants(input.eventId, context.organizationId);
    if (!found) throw eventsErrors.NOT_FOUND({ internal: input });
    return found;
  })
  .route({ method: "GET", path: "/events/:eventId" });

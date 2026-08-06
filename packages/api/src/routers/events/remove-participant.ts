import { db, eq } from "@matdesk/db";
import { eventParticipant } from "@matdesk/db/schema";

import { eventsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getParticipantInOrganization } from "../../queries/events";
import { participantIdInput } from "./schemas";

export const removeEventParticipant = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ events: ["update"] }))
  .input(participantIdInput)
  .handler(async ({ input, context }) => {
    const found = await getParticipantInOrganization(input.participantId, context.organizationId);
    if (!found) throw eventsErrors.PARTICIPANT_NOT_FOUND({ internal: input });
    const [deleted] = await db
      .delete(eventParticipant)
      .where(eq(eventParticipant.id, input.participantId))
      .returning();
    return deleted!;
  })
  .route({ method: "DELETE", path: "/events/participants/:participantId" });

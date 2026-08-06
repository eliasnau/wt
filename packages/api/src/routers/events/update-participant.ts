import { and, count, db, eq, ne } from "@matdesk/db";
import { eventParticipant } from "@matdesk/db/schema";
import { z } from "zod";

import { eventsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getParticipantInOrganization } from "../../queries/events";
import { eventStatusSchema } from "./schemas";

const input = z.object({
  participantId: z.string().trim().min(1),
  status: eventStatusSchema,
});

export const updateEventParticipant = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ events: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const found = await getParticipantInOrganization(input.participantId, context.organizationId);
    if (!found) throw eventsErrors.PARTICIPANT_NOT_FOUND({ internal: input });

    const becomesActive = found.participant.status === "cancelled" && input.status !== "cancelled";
    if (becomesActive && found.participant.memberId) {
      const duplicate = await db.query.eventParticipant.findFirst({
        where: (participant, { and, eq, ne }) =>
          and(
            eq(participant.eventId, found.event.id),
            eq(participant.memberId, found.participant.memberId!),
            ne(participant.status, "cancelled"),
          ),
      });
      if (duplicate) {
        throw eventsErrors.ALREADY_REGISTERED({ internal: input });
      }
    }
    if (becomesActive && found.event.capacity != null) {
      const [row] = await db
        .select({ count: count() })
        .from(eventParticipant)
        .where(
          and(
            eq(eventParticipant.eventId, found.event.id),
            ne(eventParticipant.status, "cancelled"),
          ),
        );
      if ((row?.count ?? 0) >= found.event.capacity) {
        throw eventsErrors.EVENT_FULL({ internal: input });
      }
    }

    const [updated] = await db
      .update(eventParticipant)
      .set({ status: input.status })
      .where(eq(eventParticipant.id, input.participantId))
      .returning();
    return updated!;
  })
  .route({ method: "PATCH", path: "/events/participants/:participantId" });

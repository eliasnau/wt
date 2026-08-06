import { and, count, db, eq, ne } from "@matdesk/db";
import { eventParticipant } from "@matdesk/db/schema";
import { z } from "zod";

import { eventsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getEventById } from "../../queries/events";

const input = z
  .object({
    eventId: z.string().trim().min(1),
    memberId: z.string().trim().min(1).optional(),
    guestName: z.string().trim().min(1).max(255).optional(),
  })
  .refine((value) => Boolean(value.memberId) !== Boolean(value.guestName), {
    message: "Choose either a member or a guest name",
  });

export const addEventParticipant = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ events: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const foundEvent = await getEventById(input.eventId, context.organizationId);
    if (!foundEvent) throw eventsErrors.NOT_FOUND({ internal: input });

    if (input.memberId) {
      const foundMember = await db.query.clubMember.findFirst({
        where: (member, { and, eq }) =>
          and(eq(member.id, input.memberId!), eq(member.organizationId, context.organizationId)),
      });
      if (!foundMember) throw eventsErrors.MEMBER_NOT_FOUND({ internal: input });

      const duplicate = await db.query.eventParticipant.findFirst({
        where: (participant, { and, eq, ne }) =>
          and(
            eq(participant.eventId, input.eventId),
            eq(participant.memberId, input.memberId!),
            ne(participant.status, "cancelled"),
          ),
      });
      if (duplicate) throw eventsErrors.ALREADY_REGISTERED({ internal: input });
    }

    if (foundEvent.capacity != null) {
      const [row] = await db
        .select({ count: count() })
        .from(eventParticipant)
        .where(
          and(
            eq(eventParticipant.eventId, input.eventId),
            ne(eventParticipant.status, "cancelled"),
          ),
        );
      if ((row?.count ?? 0) >= foundEvent.capacity) {
        throw eventsErrors.EVENT_FULL({ internal: { eventId: input.eventId } });
      }
    }

    const [created] = await db
      .insert(eventParticipant)
      .values({
        eventId: input.eventId,
        memberId: input.memberId,
        guestName: input.guestName,
      })
      .returning();
    return created!;
  })
  .route({ method: "POST", path: "/events/:eventId/participants" });

import { asc, db, eq, sql } from "@matdesk/db";
import { event, eventParticipant } from "@matdesk/db/schema";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";

export const listEvents = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ events: ["view"] }))
  .handler(async ({ context }) => {
    const rows = await db
      .select({
        event,
        participantCount: sql<number>`count(${eventParticipant.id}) filter (where ${eventParticipant.status} <> 'cancelled')::int`,
      })
      .from(event)
      .leftJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
      .where(eq(event.organizationId, context.organizationId))
      .groupBy(event.id)
      .orderBy(asc(event.date), asc(event.startTime));

    return rows.map((row) => ({ ...row.event, participantCount: row.participantCount }));
  })
  .route({ method: "GET", path: "/events" });

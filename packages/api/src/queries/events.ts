import { and, asc, db, eq } from "@matdesk/db";
import { clubMember, event, eventParticipant } from "@matdesk/db/schema";

export function getEventById(eventId: string, organizationId: string) {
  return db.query.event.findFirst({
    where: (row, { and, eq }) => and(eq(row.id, eventId), eq(row.organizationId, organizationId)),
  });
}

export async function getEventWithParticipants(eventId: string, organizationId: string) {
  const found = await getEventById(eventId, organizationId);
  if (!found) return undefined;

  const participants = await db
    .select({ participant: eventParticipant, member: clubMember })
    .from(eventParticipant)
    .leftJoin(clubMember, eq(eventParticipant.memberId, clubMember.id))
    .where(eq(eventParticipant.eventId, found.id))
    .orderBy(asc(clubMember.lastName), asc(clubMember.firstName), asc(eventParticipant.guestName));

  return {
    ...found,
    participants: participants.map(({ participant, member }) => ({
      ...participant,
      member,
    })),
  };
}

export function getParticipantInOrganization(participantId: string, organizationId: string) {
  return db
    .select({ participant: eventParticipant, event })
    .from(eventParticipant)
    .innerJoin(event, eq(eventParticipant.eventId, event.id))
    .where(and(eq(eventParticipant.id, participantId), eq(event.organizationId, organizationId)))
    .then((rows) => rows[0]);
}

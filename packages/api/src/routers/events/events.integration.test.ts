import { clubMember, event, eventParticipant, organization } from "@matdesk/db/schema";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../../../test/helpers/pg";

let db: TestDb;
const organizationId = "events-test";

beforeEach(async () => {
  ({ db } = await createTestDb());
  await db.insert(organization).values({
    id: organizationId,
    name: "Event Dojo",
    slug: organizationId,
  });
});

async function seedEvent() {
  const [created] = await db
    .insert(event)
    .values({ organizationId, name: "Sommerfest", date: "2026-08-20" })
    .returning();
  return created!;
}

async function seedMember() {
  const [created] = await db
    .insert(clubMember)
    .values({
      organizationId,
      firstName: "Max",
      lastName: "Mustermann",
      street: "Hauptstraße 1",
      city: "Berlin",
      state: "Berlin",
      postalCode: "10115",
      country: "DE",
      iban: "DE89370400440532013000",
      bic: "COBADEFFXXX",
      cardHolder: "Max Mustermann",
    })
    .returning();
  return created!;
}

describe("events schema", () => {
  it("accepts a member or guest participant, but not both", async () => {
    const createdEvent = await seedEvent();
    const member = await seedMember();

    await db.insert(eventParticipant).values({
      eventId: createdEvent.id,
      memberId: member.id,
    });
    await db.insert(eventParticipant).values({
      eventId: createdEvent.id,
      guestName: "Erika Beispiel",
    });

    await expect(
      db.insert(eventParticipant).values({
        eventId: createdEvent.id,
        memberId: member.id,
        guestName: "Doppelte Identität",
      }),
    ).rejects.toThrow();
  });

  it("prevents duplicate active member registrations", async () => {
    const createdEvent = await seedEvent();
    const member = await seedMember();
    await db.insert(eventParticipant).values({
      eventId: createdEvent.id,
      memberId: member.id,
    });

    await expect(
      db.insert(eventParticipant).values({
        eventId: createdEvent.id,
        memberId: member.id,
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid capacity, price and time ranges", async () => {
    await expect(
      db.insert(event).values({
        organizationId,
        name: "Ungültig",
        date: "2026-08-20",
        capacity: -1,
      }),
    ).rejects.toThrow();

    await expect(
      db.insert(event).values({
        organizationId,
        name: "Ungültig",
        date: "2026-08-20",
        priceCents: -1,
      }),
    ).rejects.toThrow();

    await expect(
      db.insert(event).values({
        organizationId,
        name: "Ungültig",
        date: "2026-08-20",
        startTime: "18:00",
        endTime: "17:00",
      }),
    ).rejects.toThrow();
  });
});

import {
  coachingAppointment,
  coachingParticipant,
  clubMember,
  organization,
  user,
} from "@matdesk/db/schema";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../../../test/helpers/pg";

let db: TestDb;
const organizationId = "coaching-test";
const coachUserId = "coach-test";

beforeEach(async () => {
  ({ db } = await createTestDb());
  await db
    .insert(organization)
    .values({ id: organizationId, name: "Coaching Dojo", slug: organizationId });
  await db.insert(user).values({ id: coachUserId, name: "Coach Kim", email: "coach@example.com" });
});

async function seedAppointment() {
  const [created] = await db
    .insert(coachingAppointment)
    .values({
      organizationId,
      coachUserId,
      date: "2026-08-20",
      startTime: "10:00",
      endTime: "11:00",
    })
    .returning();
  return created!;
}

async function seedMember() {
  const [created] = await db
    .insert(clubMember)
    .values({
      organizationId,
      firstName: "Max",
      lastName: "Muster",
      street: "Straße 1",
      city: "Berlin",
      state: "Berlin",
      postalCode: "10115",
      country: "DE",
      iban: "DE89370400440532013000",
      bic: "COBADEFFXXX",
      cardHolder: "Max Muster",
    })
    .returning();
  return created!;
}

describe("coaching schema", () => {
  it("accepts members or guests and prevents duplicate members", async () => {
    const appointment = await seedAppointment();
    const member = await seedMember();
    await db
      .insert(coachingParticipant)
      .values({ appointmentId: appointment.id, memberId: member.id });
    await db
      .insert(coachingParticipant)
      .values({ appointmentId: appointment.id, guestName: "Gast Person" });
    await expect(
      db.insert(coachingParticipant).values({ appointmentId: appointment.id, memberId: member.id }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(coachingParticipant)
        .values({ appointmentId: appointment.id, memberId: member.id, guestName: "Beides" }),
    ).rejects.toThrow();
  });

  it("rejects invalid times, prices and states", async () => {
    await expect(
      db
        .insert(coachingAppointment)
        .values({
          organizationId,
          coachUserId,
          date: "2026-08-20",
          startTime: "11:00",
          endTime: "10:00",
        }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(coachingAppointment)
        .values({
          organizationId,
          coachUserId,
          date: "2026-08-20",
          startTime: "10:00",
          endTime: "11:00",
          priceCents: -1,
        }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(coachingAppointment)
        .values({
          organizationId,
          coachUserId,
          date: "2026-08-20",
          startTime: "10:00",
          endTime: "11:00",
          paymentStatus: "unknown",
        }),
    ).rejects.toThrow();
  });
});

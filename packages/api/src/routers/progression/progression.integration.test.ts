import {
  clubMember,
  group,
  memberRank,
  organization,
  progressionRank,
  progressionSystem,
} from "@matdesk/db/schema";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../../../test/helpers/pg";

let db: TestDb;
const organizationId = "progression-test";

beforeEach(async () => {
  ({ db } = await createTestDb());
  await db.insert(organization).values({
    id: organizationId,
    name: "Mehrsparten-Schule",
    slug: organizationId,
  });
});

describe("progression schema", () => {
  it("supports multiple systems and assigns a group to one of them", async () => {
    const [karate, bjj] = await db
      .insert(progressionSystem)
      .values([
        { organizationId, name: "Karate Kyu/Dan" },
        { organizationId, name: "BJJ Gürtel" },
      ])
      .returning();

    const [createdGroup] = await db
      .insert(group)
      .values({
        organizationId,
        name: "BJJ Erwachsene",
        color: "#3b82f6",
        progressionSystemId: bjj!.id,
      })
      .returning();

    expect(karate!.id).not.toBe(bjj!.id);
    expect(createdGroup!.progressionSystemId).toBe(bjj!.id);
  });

  it("keeps rank order unique and prevents awarding the same rank twice", async () => {
    const [system] = await db
      .insert(progressionSystem)
      .values({ organizationId, name: "Karate" })
      .returning();
    const [rank] = await db
      .insert(progressionRank)
      .values({ progressionSystemId: system!.id, name: "9. Kyu", sortOrder: 0 })
      .returning();
    const [member] = await db
      .insert(clubMember)
      .values({
        organizationId,
        firstName: "Mina",
        lastName: "Muster",
        street: "Dojo 1",
        city: "Berlin",
        state: "Berlin",
        postalCode: "10115",
        country: "DE",
        iban: "DE89370400440532013000",
        bic: "COBADEFFXXX",
        cardHolder: "Mina Muster",
      })
      .returning();

    await expect(
      db.insert(progressionRank).values({
        progressionSystemId: system!.id,
        name: "Andere Stufe",
        sortOrder: 0,
      }),
    ).rejects.toThrow();

    const award = {
      organizationId,
      memberId: member!.id,
      progressionSystemId: system!.id,
      progressionRankId: rank!.id,
      awardedOn: "2026-08-06",
    };
    await db.insert(memberRank).values(award);
    await expect(db.insert(memberRank).values(award)).rejects.toThrow();
  });
});

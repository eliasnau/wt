import { and, asc, count, db, eq, inArray } from "@matdesk/db";
import { group, memberRank, progressionRank, progressionSystem } from "@matdesk/db/schema";

export async function loadProgressionSystems(organizationId: string) {
  const systems = await db
    .select()
    .from(progressionSystem)
    .where(eq(progressionSystem.organizationId, organizationId))
    .orderBy(asc(progressionSystem.name));
  if (systems.length === 0) return [];

  const systemIds = systems.map((system) => system.id);
  const [ranks, groups, awardCounts] = await Promise.all([
    db
      .select()
      .from(progressionRank)
      .where(inArray(progressionRank.progressionSystemId, systemIds))
      .orderBy(asc(progressionRank.sortOrder)),
    db
      .select({
        id: group.id,
        name: group.name,
        progressionSystemId: group.progressionSystemId,
      })
      .from(group)
      .where(inArray(group.progressionSystemId, systemIds)),
    db
      .select({
        rankId: memberRank.progressionRankId,
        memberCount: count(),
      })
      .from(memberRank)
      .where(inArray(memberRank.progressionSystemId, systemIds))
      .groupBy(memberRank.progressionRankId),
  ]);

  const countByRank = new Map(awardCounts.map((row) => [row.rankId, row.memberCount]));

  return systems.map((system) => ({
    ...system,
    ranks: ranks
      .filter((rank) => rank.progressionSystemId === system.id)
      .map((rank) => ({ ...rank, memberCount: countByRank.get(rank.id) ?? 0 })),
    groups: groups.filter((row) => row.progressionSystemId === system.id),
  }));
}

export async function loadMemberRanks(organizationId: string, memberId: string) {
  return db
    .select({
      award: memberRank,
      system: progressionSystem,
      rank: progressionRank,
    })
    .from(memberRank)
    .innerJoin(progressionSystem, eq(memberRank.progressionSystemId, progressionSystem.id))
    .innerJoin(progressionRank, eq(memberRank.progressionRankId, progressionRank.id))
    .where(and(eq(memberRank.organizationId, organizationId), eq(memberRank.memberId, memberId)));
}

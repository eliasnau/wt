import { and, asc, count, db, eq, sql, transactionDb } from "@matdesk/db";
import {
  clubMember,
  event,
  group,
  memberRank,
  progressionRank,
  progressionSystem,
} from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { progressionErrors } from "../../errors";
import { progressionPresets } from "../../domain/progression/presets";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { loadMemberRanks, loadProgressionSystems } from "../../queries/progression";
import {
  progressionColorSchema,
  progressionDateSchema,
  progressionIdSchema,
  progressionModeSchema,
} from "./schemas";

const configure = requirePermission({ progression: ["configure"] });
const view = requirePermission({ progression: ["view"] });
const award = requirePermission({ progression: ["award"] });

export const listProgressionSystems = orgProcedure
  .use(view)
  .handler(({ context }) => loadProgressionSystems(context.organizationId));

export const createProgressionSystem = orgProcedure
  .meta({ cost: 5 })
  .use(configure)
  .input(
    z.object({
      name: z.string().trim().min(1).max(255),
      unitLabel: z.string().trim().min(1).max(100).default("Graduierung"),
      mode: progressionModeSchema.default("sequential"),
    }),
  )
  .handler(async ({ input, context }) => {
    const [created] = await db
      .insert(progressionSystem)
      .values({ ...input, organizationId: context.organizationId })
      .returning();
    if (!created) throw createError({ message: "Couldn't create graduation system", status: 500 });
    return created;
  });

export const createProgressionPreset = orgProcedure
  .meta({ cost: 10 })
  .use(configure)
  .input(z.object({ presetId: z.enum(["judo_djb", "taekwondo_dtu", "wing_tzun_wtfb"]) }))
  .handler(async ({ input, context }) => {
    const preset = progressionPresets[input.presetId];
    return transactionDb.transaction(async (tx) => {
      const [created] = await tx
        .insert(progressionSystem)
        .values({
          organizationId: context.organizationId,
          name: preset.name,
          unitLabel: preset.unitLabel,
          mode: preset.mode,
        })
        .returning();
      if (!created) {
        throw createError({ message: "Couldn't create graduation preset", status: 500 });
      }
      await tx.insert(progressionRank).values(
        preset.ranks.map(([name, color], sortOrder) => ({
          progressionSystemId: created.id,
          name,
          color,
          sortOrder,
        })),
      );
      return created;
    });
  });

export const updateProgressionSystem = orgProcedure
  .meta({ cost: 5 })
  .use(configure)
  .input(
    z.object({
      systemId: progressionIdSchema,
      name: z.string().trim().min(1).max(255).optional(),
      unitLabel: z.string().trim().min(1).max(100).optional(),
      mode: progressionModeSchema.optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { systemId, ...patch } = input;
    const [updated] = await db
      .update(progressionSystem)
      .set(patch)
      .where(
        and(
          eq(progressionSystem.id, systemId),
          eq(progressionSystem.organizationId, context.organizationId),
        ),
      )
      .returning();
    if (!updated) throw progressionErrors.SYSTEM_NOT_FOUND();
    return updated;
  });

export const deleteProgressionSystem = orgProcedure
  .meta({ cost: 5 })
  .use(configure)
  .input(z.object({ systemId: progressionIdSchema }))
  .handler(async ({ input, context }) => {
    const [existing] = await db
      .select({ id: progressionSystem.id })
      .from(progressionSystem)
      .where(
        and(
          eq(progressionSystem.id, input.systemId),
          eq(progressionSystem.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!existing) throw progressionErrors.SYSTEM_NOT_FOUND();
    const [usage] = await db
      .select({ value: count() })
      .from(memberRank)
      .where(eq(memberRank.progressionSystemId, input.systemId));
    if ((usage?.value ?? 0) > 0) throw progressionErrors.SYSTEM_HAS_AWARDS();
    await db.delete(progressionSystem).where(eq(progressionSystem.id, input.systemId));
    return { success: true };
  });

export const createProgressionRank = orgProcedure
  .meta({ cost: 5 })
  .use(configure)
  .input(
    z.object({
      systemId: progressionIdSchema,
      name: z.string().trim().min(1).max(255),
      color: progressionColorSchema.nullish(),
    }),
  )
  .handler(async ({ input, context }) => {
    const [system] = await db
      .select({ id: progressionSystem.id })
      .from(progressionSystem)
      .where(
        and(
          eq(progressionSystem.id, input.systemId),
          eq(progressionSystem.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!system) throw progressionErrors.SYSTEM_NOT_FOUND();
    const [maximum] = await db
      .select({ value: sql<number>`coalesce(max(${progressionRank.sortOrder}), -1)` })
      .from(progressionRank)
      .where(eq(progressionRank.progressionSystemId, input.systemId));
    const [created] = await db
      .insert(progressionRank)
      .values({
        progressionSystemId: input.systemId,
        name: input.name,
        color: input.color ?? null,
        sortOrder: Number(maximum?.value ?? -1) + 1,
      })
      .returning();
    if (!created) throw createError({ message: "Couldn't create graduation rank", status: 500 });
    return created;
  });

export const updateProgressionRank = orgProcedure
  .meta({ cost: 5 })
  .use(configure)
  .input(
    z.object({
      rankId: progressionIdSchema,
      name: z.string().trim().min(1).max(255).optional(),
      color: progressionColorSchema.nullish(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { rankId, ...patch } = input;
    const [rank] = await db
      .select({ id: progressionRank.id })
      .from(progressionRank)
      .innerJoin(progressionSystem, eq(progressionRank.progressionSystemId, progressionSystem.id))
      .where(
        and(
          eq(progressionRank.id, rankId),
          eq(progressionSystem.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!rank) throw progressionErrors.RANK_NOT_FOUND();
    const [updated] = await db
      .update(progressionRank)
      .set(patch)
      .where(eq(progressionRank.id, rankId))
      .returning();
    return updated;
  });

export const deleteProgressionRank = orgProcedure
  .meta({ cost: 5 })
  .use(configure)
  .input(z.object({ rankId: progressionIdSchema }))
  .handler(async ({ input, context }) => {
    const [rank] = await db
      .select({ id: progressionRank.id })
      .from(progressionRank)
      .innerJoin(progressionSystem, eq(progressionRank.progressionSystemId, progressionSystem.id))
      .where(
        and(
          eq(progressionRank.id, input.rankId),
          eq(progressionSystem.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!rank) throw progressionErrors.RANK_NOT_FOUND();
    const [usage] = await db
      .select({ value: count() })
      .from(memberRank)
      .where(eq(memberRank.progressionRankId, input.rankId));
    if ((usage?.value ?? 0) > 0) throw progressionErrors.RANK_HAS_AWARDS();
    await db.delete(progressionRank).where(eq(progressionRank.id, input.rankId));
    return { success: true };
  });

export const reorderProgressionRanks = orgProcedure
  .meta({ cost: 5 })
  .use(configure)
  .input(z.object({ systemId: progressionIdSchema, rankIds: z.array(progressionIdSchema) }))
  .handler(async ({ input, context }) => {
    const [system] = await db
      .select({ id: progressionSystem.id })
      .from(progressionSystem)
      .where(
        and(
          eq(progressionSystem.id, input.systemId),
          eq(progressionSystem.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!system) throw progressionErrors.SYSTEM_NOT_FOUND();
    const ranks = await db
      .select({ id: progressionRank.id })
      .from(progressionRank)
      .where(eq(progressionRank.progressionSystemId, input.systemId))
      .orderBy(asc(progressionRank.sortOrder));
    if (
      ranks.length !== input.rankIds.length ||
      new Set(input.rankIds).size !== ranks.length ||
      input.rankIds.some((id) => !ranks.some((rank) => rank.id === id))
    ) {
      throw createError({
        message: "Rank order must contain every rank exactly once",
        status: 400,
      });
    }
    await transactionDb.transaction(async (tx) => {
      for (const [index, rankId] of input.rankIds.entries())
        await tx
          .update(progressionRank)
          .set({ sortOrder: index + 100_000 })
          .where(eq(progressionRank.id, rankId));
      for (const [index, rankId] of input.rankIds.entries())
        await tx
          .update(progressionRank)
          .set({ sortOrder: index })
          .where(eq(progressionRank.id, rankId));
    });
    return { success: true };
  });

export const listMemberProgression = orgProcedure
  .use(view)
  .input(z.object({ memberId: progressionIdSchema }))
  .handler(async ({ input, context }) => {
    const [member] = await db
      .select({ id: clubMember.id })
      .from(clubMember)
      .where(
        and(
          eq(clubMember.id, input.memberId),
          eq(clubMember.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!member) throw progressionErrors.MEMBER_NOT_FOUND();
    return loadMemberRanks(context.organizationId, input.memberId);
  });

export const listProgressionRankMembers = orgProcedure
  .use(view)
  .input(z.object({ rankId: progressionIdSchema }))
  .handler(async ({ input, context }) => {
    const [rank] = await db
      .select({ id: progressionRank.id })
      .from(progressionRank)
      .innerJoin(progressionSystem, eq(progressionRank.progressionSystemId, progressionSystem.id))
      .where(
        and(
          eq(progressionRank.id, input.rankId),
          eq(progressionSystem.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!rank) throw progressionErrors.RANK_NOT_FOUND();

    return db
      .select({
        id: clubMember.id,
        firstName: clubMember.firstName,
        lastName: clubMember.lastName,
        awardedOn: memberRank.awardedOn,
      })
      .from(memberRank)
      .innerJoin(clubMember, eq(clubMember.id, memberRank.memberId))
      .where(
        and(
          eq(memberRank.organizationId, context.organizationId),
          eq(memberRank.progressionRankId, input.rankId),
        ),
      )
      .orderBy(asc(clubMember.lastName), asc(clubMember.firstName));
  });

export const awardProgressionRank = orgProcedure
  .meta({ cost: 5 })
  .use(award)
  .input(
    z.object({
      memberId: progressionIdSchema,
      systemId: progressionIdSchema,
      rankId: progressionIdSchema,
      eventId: progressionIdSchema.nullish(),
      awardedOn: progressionDateSchema,
      notes: z.string().trim().max(2000).nullish(),
    }),
  )
  .handler(async ({ input, context }) => {
    const [member] = await db
      .select({ id: clubMember.id })
      .from(clubMember)
      .where(
        and(
          eq(clubMember.id, input.memberId),
          eq(clubMember.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!member) throw progressionErrors.MEMBER_NOT_FOUND();
    const [rank] = await db
      .select({ systemId: progressionRank.progressionSystemId })
      .from(progressionRank)
      .innerJoin(progressionSystem, eq(progressionRank.progressionSystemId, progressionSystem.id))
      .where(
        and(
          eq(progressionRank.id, input.rankId),
          eq(progressionSystem.id, input.systemId),
          eq(progressionSystem.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!rank) throw progressionErrors.RANK_NOT_IN_SYSTEM();
    if (input.eventId) {
      const [linkedEvent] = await db
        .select({ id: event.id })
        .from(event)
        .where(and(eq(event.id, input.eventId), eq(event.organizationId, context.organizationId)))
        .limit(1);
      if (!linkedEvent) throw createError({ message: "Event not found", status: 404 });
    }
    const [existing] = await db
      .select({ id: memberRank.id })
      .from(memberRank)
      .where(
        and(
          eq(memberRank.memberId, input.memberId),
          eq(memberRank.progressionRankId, input.rankId),
        ),
      )
      .limit(1);
    if (existing) throw progressionErrors.ALREADY_HOLDS_RANK();
    const [created] = await db
      .insert(memberRank)
      .values({
        organizationId: context.organizationId,
        memberId: input.memberId,
        progressionSystemId: input.systemId,
        progressionRankId: input.rankId,
        eventId: input.eventId ?? null,
        awardedOn: input.awardedOn,
        notes: input.notes ?? null,
      })
      .returning();
    if (!created) throw createError({ message: "Couldn't award graduation rank", status: 500 });
    return created;
  });

export const updateProgressionAward = orgProcedure
  .meta({ cost: 5 })
  .use(award)
  .input(
    z.object({
      awardId: progressionIdSchema,
      awardedOn: progressionDateSchema,
      notes: z.string().trim().max(2000).nullish(),
    }),
  )
  .handler(async ({ input, context }) => {
    const [updated] = await db
      .update(memberRank)
      .set({ awardedOn: input.awardedOn, notes: input.notes ?? null })
      .where(
        and(
          eq(memberRank.id, input.awardId),
          eq(memberRank.organizationId, context.organizationId),
        ),
      )
      .returning();
    if (!updated) throw progressionErrors.AWARD_NOT_FOUND();
    return updated;
  });

export const deleteProgressionAward = orgProcedure
  .meta({ cost: 5 })
  .use(award)
  .input(z.object({ awardId: progressionIdSchema }))
  .handler(async ({ input, context }) => {
    const [deleted] = await db
      .delete(memberRank)
      .where(
        and(
          eq(memberRank.id, input.awardId),
          eq(memberRank.organizationId, context.organizationId),
        ),
      )
      .returning({ id: memberRank.id });
    if (!deleted) throw progressionErrors.AWARD_NOT_FOUND();
    return { success: true };
  });

export const assignGroupProgressionSystem = orgProcedure
  .meta({ cost: 5 })
  .use(configure)
  .input(z.object({ groupId: progressionIdSchema, systemId: progressionIdSchema.nullable() }))
  .handler(async ({ input, context }) => {
    if (input.systemId) {
      const [system] = await db
        .select({ id: progressionSystem.id })
        .from(progressionSystem)
        .where(
          and(
            eq(progressionSystem.id, input.systemId),
            eq(progressionSystem.organizationId, context.organizationId),
          ),
        )
        .limit(1);
      if (!system) throw progressionErrors.SYSTEM_NOT_FOUND();
    }
    const [updated] = await db
      .update(group)
      .set({ progressionSystemId: input.systemId })
      .where(and(eq(group.id, input.groupId), eq(group.organizationId, context.organizationId)))
      .returning();
    if (!updated) throw createError({ message: "Group not found", status: 404 });
    return updated;
  });

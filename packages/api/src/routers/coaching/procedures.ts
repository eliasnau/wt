import { and, asc, db, eq, ne, transactionDb } from "@matdesk/db";
import { coachingAppointment, coachingParticipant, clubMember, member } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { timesOverlap } from "../../domain/coaching/conflicts";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";

const id = z.string().trim().min(1);
const status = z.enum(["scheduled", "attended", "no_show", "cancelled"]);
const paymentStatus = z.enum(["open", "paid", "waived"]);
const participant = z
  .object({
    memberId: id.optional(),
    guestName: z.string().trim().min(1).max(255).optional(),
    guestEmail: z.string().trim().email().optional().or(z.literal("")),
    guestPhone: z.string().trim().max(100).optional(),
  })
  .refine(
    (value) => Number(Boolean(value.memberId)) + Number(Boolean(value.guestName)) === 1,
    "Choose a member or guest",
  );

const fields = z.object({
  coachUserId: id,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().trim().max(255).nullish(),
  priceCents: z.number().int().nonnegative().nullish(),
  paymentStatus: paymentStatus.default("open"),
  notes: z.string().trim().max(5000).nullish(),
  participants: z.array(participant).min(1),
  allowConflict: z.boolean().default(false),
});

const view = requirePermission({ coaching: ["view"] });
const create = requirePermission({ coaching: ["create"] });
const update = requirePermission({ coaching: ["update"] });
const remove = requirePermission({ coaching: ["delete"] });

async function assertCoach(organizationId: string, coachUserId: string) {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, coachUserId)))
    .limit(1);
  if (!row) throw createError({ message: "Trainer gehört nicht zur Organisation", status: 400 });
}

async function assertParticipants(
  organizationId: string,
  participants: z.infer<typeof participant>[],
) {
  for (const item of participants) {
    if (!item.memberId) continue;
    const [row] = await db
      .select({ id: clubMember.id })
      .from(clubMember)
      .where(and(eq(clubMember.organizationId, organizationId), eq(clubMember.id, item.memberId)))
      .limit(1);
    if (!row) throw createError({ message: "Mitglied nicht gefunden", status: 404 });
  }
}

async function assertNoConflict(
  input: z.infer<typeof fields>,
  organizationId: string,
  excludeId?: string,
) {
  if (input.endTime <= input.startTime)
    throw createError({ message: "Die Endzeit muss nach der Startzeit liegen", status: 400 });
  if (input.allowConflict) return;
  const rows = await db
    .select({
      id: coachingAppointment.id,
      startTime: coachingAppointment.startTime,
      endTime: coachingAppointment.endTime,
    })
    .from(coachingAppointment)
    .where(
      and(
        eq(coachingAppointment.organizationId, organizationId),
        eq(coachingAppointment.coachUserId, input.coachUserId),
        eq(coachingAppointment.date, input.date),
        ne(coachingAppointment.status, "cancelled"),
        excludeId ? ne(coachingAppointment.id, excludeId) : undefined,
      ),
    );
  if (
    rows.some((row) => timesOverlap(input.startTime, input.endTime, row.startTime, row.endTime))
  ) {
    throw createError({
      message: "Der Trainer hat zu dieser Zeit bereits ein Coaching",
      status: 409,
    });
  }
}

export const listCoaching = orgProcedure
  .use(view)
  .input(z.object({ memberId: id.optional() }).optional())
  .handler(async ({ input, context }) => {
    const rows = await db.query.coachingAppointment.findMany({
      where: (table, { and: all, eq: equal }) =>
        all(equal(table.organizationId, context.organizationId)),
      with: {
        coach: { columns: { id: true, name: true, email: true, image: true } },
        participants: { with: { member: true } },
      },
      orderBy: [asc(coachingAppointment.date), asc(coachingAppointment.startTime)],
    });
    return input?.memberId
      ? rows.filter((row) => row.participants.some((item) => item.memberId === input.memberId))
      : rows;
  });

export const createCoaching = orgProcedure
  .meta({ cost: 5 })
  .use(create)
  .input(fields)
  .handler(async ({ input, context }) => {
    await Promise.all([
      assertCoach(context.organizationId, input.coachUserId),
      assertParticipants(context.organizationId, input.participants),
      assertNoConflict(input, context.organizationId),
    ]);
    return transactionDb.transaction(async (tx) => {
      const { participants, allowConflict: _, ...values } = input;
      const [created] = await tx
        .insert(coachingAppointment)
        .values({
          ...values,
          organizationId: context.organizationId,
          createdByUserId: context.session.user.id,
        })
        .returning();
      if (!created)
        throw createError({ message: "Coaching konnte nicht erstellt werden", status: 500 });
      await tx
        .insert(coachingParticipant)
        .values(
          participants.map((item) => ({
            appointmentId: created.id,
            memberId: item.memberId,
            guestName: item.guestName,
            guestEmail: item.guestEmail || null,
            guestPhone: item.guestPhone || null,
          })),
        );
      return created;
    });
  });

export const updateCoaching = orgProcedure
  .meta({ cost: 5 })
  .use(update)
  .input(fields.extend({ appointmentId: id }))
  .handler(async ({ input, context }) => {
    const [existing] = await db
      .select()
      .from(coachingAppointment)
      .where(
        and(
          eq(coachingAppointment.id, input.appointmentId),
          eq(coachingAppointment.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!existing) throw createError({ message: "Coaching nicht gefunden", status: 404 });
    await Promise.all([
      assertCoach(context.organizationId, input.coachUserId),
      assertParticipants(context.organizationId, input.participants),
      assertNoConflict(input, context.organizationId, input.appointmentId),
    ]);
    return transactionDb.transaction(async (tx) => {
      const { appointmentId, participants, allowConflict: _, ...values } = input;
      const [updated] = await tx
        .update(coachingAppointment)
        .set(values)
        .where(eq(coachingAppointment.id, appointmentId))
        .returning();
      await tx
        .delete(coachingParticipant)
        .where(eq(coachingParticipant.appointmentId, appointmentId));
      await tx
        .insert(coachingParticipant)
        .values(
          participants.map((item) => ({
            appointmentId,
            memberId: item.memberId,
            guestName: item.guestName,
            guestEmail: item.guestEmail || null,
            guestPhone: item.guestPhone || null,
          })),
        );
      return updated;
    });
  });

export const setCoachingState = orgProcedure
  .meta({ cost: 5 })
  .use(update)
  .input(
    z.object({
      appointmentId: id,
      status: status.optional(),
      paymentStatus: paymentStatus.optional(),
      cancellationReason: z.string().trim().max(1000).nullish(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { appointmentId, ...patch } = input;
    const attendance = patch.status === "attended" || patch.status === "no_show";
    const [updated] = await db
      .update(coachingAppointment)
      .set({
        ...patch,
        attendanceRecordedAt: attendance ? new Date() : undefined,
        attendanceRecordedByUserId: attendance ? context.session.user.id : undefined,
      })
      .where(
        and(
          eq(coachingAppointment.id, appointmentId),
          eq(coachingAppointment.organizationId, context.organizationId),
        ),
      )
      .returning();
    if (!updated) throw createError({ message: "Coaching nicht gefunden", status: 404 });
    return updated;
  });

export const deleteCoaching = orgProcedure
  .meta({ cost: 5 })
  .use(remove)
  .input(z.object({ appointmentId: id }))
  .handler(async ({ input, context }) => {
    const [deleted] = await db
      .delete(coachingAppointment)
      .where(
        and(
          eq(coachingAppointment.id, input.appointmentId),
          eq(coachingAppointment.organizationId, context.organizationId),
          eq(coachingAppointment.status, "scheduled"),
        ),
      )
      .returning();
    if (!deleted)
      throw createError({
        message: "Nur unbearbeitete Coachings können gelöscht werden",
        status: 409,
      });
    return deleted;
  });

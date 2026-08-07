import { and, db, eq } from "@matdesk/db";
import {
  coachingAppointment,
  coachingParticipant,
  contract,
  creditGrant,
  event,
  eventParticipant,
  group,
  groupMember,
  invoice,
  memberRank,
  progressionRank,
  progressionSystem,
  sepaMandate,
} from "@matdesk/db/schema";
import { z } from "zod";

import { membersErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { memberIdInput } from "./schemas";

type TimelineCategory = "membership" | "group" | "progression" | "event" | "coaching" | "billing";

type TimelineEntry = {
  id: string;
  category: TimelineCategory;
  occurredOn: string;
  title: string;
  description: string | null;
  amountCents: number | null;
};

function ymd(value: Date | string) {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

const input = memberIdInput.extend({
  limit: z.number().int().min(1).max(100).default(50),
});

export const getMemberTimeline = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ member: ["view"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const member = await db.query.clubMember.findFirst({
      columns: { id: true, createdAt: true },
      where: (table, { and: all, eq: equal }) =>
        all(equal(table.id, input.memberId), equal(table.organizationId, context.organizationId)),
    });
    if (!member) {
      throw membersErrors.NOT_FOUND({
        internal: { memberId: input.memberId, organizationId: context.organizationId },
      });
    }

    const [
      memberships,
      awards,
      eventVisits,
      coachingVisits,
      contracts,
      credits,
      invoices,
      mandates,
    ] = await Promise.all([
      db
        .select({
          id: groupMember.id,
          groupName: group.name,
          startDate: groupMember.startDate,
          endDate: groupMember.endDate,
        })
        .from(groupMember)
        .innerJoin(group, eq(group.id, groupMember.groupId))
        .where(eq(groupMember.memberId, input.memberId)),
      db
        .select({
          id: memberRank.id,
          awardedOn: memberRank.awardedOn,
          rankName: progressionRank.name,
          systemName: progressionSystem.name,
        })
        .from(memberRank)
        .innerJoin(progressionRank, eq(progressionRank.id, memberRank.progressionRankId))
        .innerJoin(progressionSystem, eq(progressionSystem.id, memberRank.progressionSystemId))
        .where(
          and(
            eq(memberRank.memberId, input.memberId),
            eq(memberRank.organizationId, context.organizationId),
          ),
        ),
      db
        .select({
          id: eventParticipant.id,
          date: event.date,
          eventName: event.name,
          status: eventParticipant.status,
        })
        .from(eventParticipant)
        .innerJoin(event, eq(event.id, eventParticipant.eventId))
        .where(
          and(
            eq(eventParticipant.memberId, input.memberId),
            eq(event.organizationId, context.organizationId),
          ),
        ),
      db
        .select({
          id: coachingParticipant.id,
          date: coachingAppointment.date,
          status: coachingAppointment.status,
        })
        .from(coachingParticipant)
        .innerJoin(
          coachingAppointment,
          eq(coachingAppointment.id, coachingParticipant.appointmentId),
        )
        .where(
          and(
            eq(coachingParticipant.memberId, input.memberId),
            eq(coachingAppointment.organizationId, context.organizationId),
          ),
        ),
      db
        .select()
        .from(contract)
        .where(
          and(
            eq(contract.memberId, input.memberId),
            eq(contract.organizationId, context.organizationId),
          ),
        ),
      db
        .select()
        .from(creditGrant)
        .where(
          and(
            eq(creditGrant.memberId, input.memberId),
            eq(creditGrant.organizationId, context.organizationId),
          ),
        ),
      db
        .select()
        .from(invoice)
        .where(
          and(
            eq(invoice.memberId, input.memberId),
            eq(invoice.organizationId, context.organizationId),
          ),
        ),
      db
        .select()
        .from(sepaMandate)
        .where(
          and(
            eq(sepaMandate.memberId, input.memberId),
            eq(sepaMandate.organizationId, context.organizationId),
          ),
        ),
    ]);

    const entries: TimelineEntry[] = [
      {
        id: `member:${member.id}`,
        category: "membership",
        occurredOn: ymd(member.createdAt),
        title: "Mitglied angelegt",
        description: null,
        amountCents: null,
      },
    ];

    for (const item of contracts) {
      entries.push({
        id: `contract-start:${item.id}`,
        category: "membership",
        occurredOn: item.startDate,
        title: "Mitgliedschaft begonnen",
        description: null,
        amountCents: null,
      });
      if (item.cancelledAt) {
        entries.push({
          id: `contract-cancelled:${item.id}`,
          category: "membership",
          occurredOn: ymd(item.cancelledAt),
          title: "Mitgliedschaft gekündigt",
          description: item.cancellationEffectiveDate
            ? `Wirksam zum ${item.cancellationEffectiveDate}`
            : item.cancellationReason,
          amountCents: null,
        });
      }
    }

    for (const item of memberships) {
      entries.push({
        id: `group-joined:${item.id}`,
        category: "group",
        occurredOn: item.startDate,
        title: `Gruppe „${item.groupName}“ beigetreten`,
        description: null,
        amountCents: null,
      });
      if (item.endDate) {
        entries.push({
          id: `group-left:${item.id}`,
          category: "group",
          occurredOn: item.endDate,
          title: `Gruppe „${item.groupName}“ verlassen`,
          description: null,
          amountCents: null,
        });
      }
    }

    for (const item of awards) {
      entries.push({
        id: `award:${item.id}`,
        category: "progression",
        occurredOn: item.awardedOn,
        title: item.rankName,
        description: `${item.systemName} verliehen`,
        amountCents: null,
      });
    }

    const eventStatus = {
      registered: "Angemeldet",
      attended: "Teilgenommen",
      no_show: "Nicht erschienen",
      cancelled: "Abgesagt",
    } as const;
    for (const item of eventVisits) {
      entries.push({
        id: `event:${item.id}`,
        category: "event",
        occurredOn: item.date,
        title: item.eventName,
        description: eventStatus[item.status as keyof typeof eventStatus] ?? item.status,
        amountCents: null,
      });
    }

    const coachingStatus = {
      scheduled: "Geplant",
      attended: "Teilgenommen",
      no_show: "Nicht erschienen",
      cancelled: "Abgesagt",
    } as const;
    for (const item of coachingVisits) {
      entries.push({
        id: `coaching:${item.id}`,
        category: "coaching",
        occurredOn: item.date,
        title: "Einzelcoaching",
        description: coachingStatus[item.status as keyof typeof coachingStatus] ?? item.status,
        amountCents: null,
      });
    }

    for (const item of invoices) {
      entries.push({
        id: `invoice:${item.id}`,
        category: "billing",
        occurredOn: ymd(item.finalizedAt ?? item.createdAt),
        title: item.status === "void" ? "Rechnung storniert" : "Rechnung erstellt",
        description: `${item.billingPeriodStart} bis ${item.billingPeriodEnd}`,
        amountCents: item.totalCents,
      });
    }

    for (const item of credits) {
      entries.push({
        id: `credit:${item.id}`,
        category: "billing",
        occurredOn: ymd(item.createdAt),
        title: "Guthaben gewährt",
        description: item.description,
        amountCents: item.originalAmountCents,
      });
      if (item.revokedAt) {
        entries.push({
          id: `credit-revoked:${item.id}`,
          category: "billing",
          occurredOn: ymd(item.revokedAt),
          title: "Guthaben widerrufen",
          description: item.description,
          amountCents: item.originalAmountCents,
        });
      }
    }

    for (const item of mandates) {
      entries.push({
        id: `mandate:${item.id}`,
        category: "billing",
        occurredOn: item.signatureDate,
        title: "SEPA-Mandat erteilt",
        description: item.mandateReference,
        amountCents: null,
      });
      if (item.revokedAt) {
        entries.push({
          id: `mandate-revoked:${item.id}`,
          category: "billing",
          occurredOn: ymd(item.revokedAt),
          title: "SEPA-Mandat widerrufen",
          description: item.mandateReference,
          amountCents: null,
        });
      }
    }

    return entries
      .sort((left, right) =>
        right.occurredOn === left.occurredOn
          ? right.id.localeCompare(left.id)
          : right.occurredOn.localeCompare(left.occurredOn),
      )
      .slice(0, input.limit);
  })
  .route({ method: "GET", path: "/members/:memberId/timeline" });

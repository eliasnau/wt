import { ymdInBerlin } from "../../domain/members/cancellation";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { loadMemberMapRows } from "../../queries/statistics";
import { memberMapInput } from "./schemas";

type MappedMember = {
  memberId: string;
  firstName: string;
  lastName: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  groupIds: string[];
};

/**
 * Geographic snapshot: members with a usable address and their current group
 * memberships, filtered by membership status. The query returns one row per
 * (member, active group) — we fold those into one entry per member here.
 */
export const getMemberMap = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ statistics: ["view"] }))
  .input(memberMapInput)
  .handler(async ({ input, context }) => {
    const asOf = ymdInBerlin(new Date());
    const rows = await loadMemberMapRows(context.organizationId, {
      includeActive: input.includeActive,
      includeCancelledButActive: input.includeCancelledButActive,
      includeCancelled: input.includeCancelled,
      today: asOf,
    });

    type WorkingMember = Omit<MappedMember, "groupIds"> & {
      groupIds: Set<string>;
    };

    const byMember = new Map<string, WorkingMember>();
    for (const row of rows) {
      const existing = byMember.get(row.memberId);
      if (existing) {
        if (row.groupId) existing.groupIds.add(row.groupId);
        continue;
      }
      byMember.set(row.memberId, {
        memberId: row.memberId,
        firstName: row.firstName,
        lastName: row.lastName,
        city: row.city,
        postalCode: row.postalCode,
        latitude: row.latitude,
        longitude: row.longitude,
        groupIds: new Set(row.groupId ? [row.groupId] : []),
      });
    }

    const members: MappedMember[] = Array.from(byMember.values()).map(
      (member) => ({
        memberId: member.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
        city: member.city,
        postalCode: member.postalCode,
        latitude: member.latitude,
        longitude: member.longitude,
        groupIds: Array.from(member.groupIds).sort(),
      }),
    );

    context.log?.set({
      data: { statistics: { memberMapCount: members.length } },
    });

    return { asOf, members };
  })
  .route({ method: "GET", path: "/statistics/member-map" });

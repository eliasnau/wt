import { and, db, eq, inArray, isNull } from "@matdesk/db";
import { contract, group, groupMember } from "@matdesk/db/schema";

/** Fetch a member by id within an organization. Returns `undefined` if missing —
 *  callers decide how to handle (typically throw `members.NOT_FOUND`). */
export async function getMemberById(memberId: string, organizationId: string) {
  return db.query.clubMember.findFirst({
    where: (m, { and, eq }) =>
      and(eq(m.id, memberId), eq(m.organizationId, organizationId)),
  });
}

/** Member + contract + currently-active group memberships in one statement.
 *  Returns `undefined` if the member doesn't exist or belongs to another org.
 *  Historical (closed) memberships are excluded — use a dedicated query for
 *  member history when needed. */
export async function getMemberWithDetails(
  memberId: string,
  organizationId: string,
) {
  const member = await db.query.clubMember.findFirst({
    where: (m, { and, eq }) =>
      and(eq(m.id, memberId), eq(m.organizationId, organizationId)),
    with: {
      groupMembers: {
        where: (gm, { isNull }) => isNull(gm.endDate),
        with: { group: true },
      },
    },
  });
  if (!member) return undefined;

  // `contract` has no declared clubMember-side relation, so load it explicitly.
  const contracts = await db
    .select()
    .from(contract)
    .where(eq(contract.memberId, memberId));

  return { ...member, contracts };
}

export type MemberGroupMembership = {
  groupId: string;
  membershipPriceCents: number;
  group: { id: string; name: string; color: string };
};

/** Bulk-load currently-active group memberships for a set of members. Used by
 *  list/query procedures to attach `groupMembers` to each row in a single
 *  follow-up query (no N+1). */
export async function loadGroupMembershipsByMember(
  memberIds: string[],
): Promise<Map<string, MemberGroupMembership[]>> {
  if (memberIds.length === 0) {
    return new Map<string, MemberGroupMembership[]>();
  }

  const rows = await db
    .select({
      memberId: groupMember.memberId,
      groupId: groupMember.groupId,
      membershipPriceCents: groupMember.membershipPriceCents,
      groupEntityId: group.id,
      groupName: group.name,
      groupColor: group.color,
    })
    .from(groupMember)
    .innerJoin(group, eq(group.id, groupMember.groupId))
    .where(and(inArray(groupMember.memberId, memberIds), isNull(groupMember.endDate)));

  const result = new Map<string, MemberGroupMembership[]>();
  for (const row of rows) {
    const list = result.get(row.memberId) ?? [];
    list.push({
      groupId: row.groupId,
      membershipPriceCents: row.membershipPriceCents,
      group: {
        id: row.groupEntityId,
        name: row.groupName,
        color: row.groupColor,
      },
    });
    result.set(row.memberId, list);
  }
  return result;
}

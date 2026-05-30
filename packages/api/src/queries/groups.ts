import { db } from "@matdesk/db";

/** Fetch a group by id within an organization. Returns `undefined` if missing —
 *  callers decide how to handle (typically throw `groups.NOT_FOUND`). */
export async function getGroupById(groupId: string, organizationId: string) {
  return db.query.group.findFirst({
    where: (g, { and, eq }) =>
      and(eq(g.id, groupId), eq(g.organizationId, organizationId)),
  });
}

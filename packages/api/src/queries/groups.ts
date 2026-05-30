import { db } from "@matdesk/db";

import { groupsErrors } from "../errors";

/** Fetch a group by id within an organization. Throws `groups.NOT_FOUND` if missing. */
export async function getGroupById(groupId: string, organizationId: string) {
  const row = await db.query.group.findFirst({
    where: (g, { and, eq }) =>
      and(eq(g.id, groupId), eq(g.organizationId, organizationId)),
  });
  if (!row) {
    throw groupsErrors.NOT_FOUND({ internal: { groupId, organizationId } });
  }
  return row;
}

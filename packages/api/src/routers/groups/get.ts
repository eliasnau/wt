import { groupsErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getGroupById } from "../../queries/groups";
import { groupIdInput } from "./schemas";

export const getGroup = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ groups: ["view"] }))
  .input(groupIdInput)
  .handler(async ({ input, context }) => {
    const found = await getGroupById(input.id, context.organizationId);
    if (!found) {
      throw groupsErrors.NOT_FOUND({
        internal: { groupId: input.id, organizationId: context.organizationId },
      });
    }
    context.log?.set({ data: { group: { id: found.id } } });
    return found;
  })
  .route({ method: "GET", path: "/groups/:id" });

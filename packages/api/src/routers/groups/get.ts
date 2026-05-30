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
    context.log?.set({ groupId: found.id });
    return found;
  })
  .route({ method: "GET", path: "/groups/:id" });

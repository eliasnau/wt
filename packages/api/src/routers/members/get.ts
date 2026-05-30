import { membersErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getMemberWithDetails } from "../../queries/members";
import { memberIdInput } from "./schemas";

export const getMember = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ member: ["view"] }))
  .input(memberIdInput)
  .handler(async ({ input, context }) => {
    const member = await getMemberWithDetails(
      input.memberId,
      context.organizationId,
    );
    if (!member) {
      throw membersErrors.NOT_FOUND({
        internal: {
          memberId: input.memberId,
          organizationId: context.organizationId,
        },
      });
    }
    context.log?.set({ data: { member: { id: member.id } } });
    return member;
  })
  .route({ method: "GET", path: "/members/:memberId" });

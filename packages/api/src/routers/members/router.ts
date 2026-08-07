import { assignGroup } from "./assign-group";
import { cancelMemberContract } from "./cancel-contract";
import { createMember } from "./create";
import { getMember } from "./get";
import { getMemberTimeline } from "./timeline";
import { listMembers } from "./list";
import { queryMembers } from "./query";
import { removeGroupMembership } from "./remove-group-membership";
import { updateMemberContract } from "./update-contract";
import { updateMemberDetails } from "./update-details";
import { updateGroupMembership } from "./update-group-membership";

export const membersRouter = {
  list: listMembers,
  query: queryMembers,
  get: getMember,
  timeline: getMemberTimeline,
  create: createMember,
  updateDetails: updateMemberDetails,
  updateContract: updateMemberContract,
  cancelContract: cancelMemberContract,
  assignGroup,
  updateGroupMembership,
  removeGroupMembership,
};

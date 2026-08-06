import { addOrganizationMemberAdmin } from "./organizations-add-member";
import { createOrganizationAdmin } from "./organizations-create";
import { getOrganizationAdmin } from "./organizations-get";
import { listOrganizationsAdmin } from "./organizations-list";
import { removeOrganizationMemberAdmin } from "./organizations-remove-member";
import { getUserAdmin } from "./users-get";

export const adminRouter = {
  organizations: {
    list: listOrganizationsAdmin,
    get: getOrganizationAdmin,
    create: createOrganizationAdmin,
    addMember: addOrganizationMemberAdmin,
    removeMember: removeOrganizationMemberAdmin,
  },
  users: {
    get: getUserAdmin,
  },
};

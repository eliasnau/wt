import { addOrganizationMemberAdmin } from "./organizations-add-member";
import { createOrganizationAdmin } from "./organizations-create";
import { getOrganizationAdmin } from "./organizations-get";
import { listOrganizationsAdmin } from "./organizations-list";

export const adminRouter = {
  organizations: {
    list: listOrganizationsAdmin,
    get: getOrganizationAdmin,
    create: createOrganizationAdmin,
    addMember: addOrganizationMemberAdmin,
  },
};

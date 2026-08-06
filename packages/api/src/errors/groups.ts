import { defineErrorCatalog } from "evlog";

export const groupsErrors = defineErrorCatalog("groups", {
  NOT_FOUND: {
    status: 404,
    message: "Group not found",
    why: "The requested group doesn't exist or belongs to another organization.",
    fix: "Refresh the page or pick a different group.",
  },
  HAS_ACTIVE_MEMBERS: {
    status: 403,
    message: "Group still has members",
    why: "You can't delete a group that members are still assigned to.",
    fix: "Remove all members from the group, then try again.",
  },
  NOTHING_TO_UPDATE: {
    status: 400,
    message: "No changes provided",
    why: "The update didn't include any fields to change.",
    fix: "Edit at least one field before saving.",
  },
});

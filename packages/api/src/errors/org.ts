import { defineErrorCatalog } from "evlog";

export const orgErrors = defineErrorCatalog("org", {
  NO_ACTIVE_ORGANIZATION: {
    status: 400,
    message: "No organization selected",
    why: "You haven't selected an active organization.",
    fix: "Pick an organization in the dashboard to continue.",
  },
});

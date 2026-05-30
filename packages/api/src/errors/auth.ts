import { defineErrorCatalog } from "evlog";

export const authErrors = defineErrorCatalog("auth", {
  UNAUTHORIZED: {
    status: 401,
    message: "Authentication required",
    why: "You're not signed in.",
    fix: "Sign in to continue.",
  },
  PERMISSION_DENIED: {
    status: 403,
    message: "Permission denied",
    why: "Your role in this organization doesn't allow this action.",
    fix: "Ask an admin to grant the needed permissions, or switch to an organization where you have them.",
  },
});

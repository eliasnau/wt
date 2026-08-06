import { defineErrorCatalog } from "evlog";

export const adminErrors = defineErrorCatalog("admin", {
  NOT_PLATFORM_ADMIN: {
    status: 403,
    message: "Platform admin access required",
    why: "Your account is not a platform administrator.",
    fix: "Sign in with a platform admin account.",
  },
});

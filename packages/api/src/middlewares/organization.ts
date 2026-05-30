import { orgErrors } from "../errors";
import { o } from "../orpc";

export const requireOrganization = o.middleware(async ({ context, next }) => {
  // Better Auth's session type is a union; only the org-plugin branch carries
  // `activeOrganizationId`, hence the `in` narrowing.
  const sess = context.session?.session;
  const organizationId =
    sess && "activeOrganizationId" in sess ? sess.activeOrganizationId : null;

  if (!organizationId) {
    throw orgErrors.NO_ACTIVE_ORGANIZATION();
  }

  context.log?.set({ organizationId });

  return next({
    context: { organizationId },
  });
});

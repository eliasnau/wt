import { auth, type PermissionCheck } from "@matdesk/auth";
import { os } from "@orpc/server";
import type { ResponseHeadersPluginContext } from "@orpc/server/plugins";
import type { EvlogOrpcContext } from "evlog/orpc";

import type { Context } from "../context";
import { authErrors } from "../errors";

// `createAuth()` is annotated `Auth<any>`, which strips org-plugin endpoints
// from `auth.api` types. Re-type locally to avoid an `as any`.
type HasPermissionApi = {
  hasPermission: (input: {
    headers: Headers;
    body: { permissions: PermissionCheck };
  }) => Promise<boolean | { success: boolean }>;
};

const authApi = auth.api as unknown as HasPermissionApi;

// Typed against the org-scoped context so composing onto a non-org procedure
// is a compile-time error, not a runtime surprise.
type OrgScopedContext = Context &
  Partial<EvlogOrpcContext> &
  ResponseHeadersPluginContext & {
    organizationId: string;
  };

const oOrgScoped = os.$context<OrgScopedContext>();

/** Enforce a permission check against the caller's active organization role. */
export function requirePermission(permissions: PermissionCheck) {
  return oOrgScoped.middleware(async ({ context, next }) => {
    const result = await authApi.hasPermission({
      headers: context.headers,
      body: { permissions },
    });

    // Better Auth returns either a boolean or `{ success }` across versions.
    const granted =
      typeof result === "boolean" ? result : result?.success === true;

    if (!granted) {
      throw authErrors.PERMISSION_DENIED({
        internal: { requestedPermissions: permissions },
      });
    }

    return next();
  });
}

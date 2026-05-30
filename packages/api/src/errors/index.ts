/**
 * Error catalogs. Prefer these over ad-hoc `createError(...)` so `code` stays
 * stable for client branching. Register new catalogs in `RegisteredErrorCatalogs`
 * below so their codes flow into autocomplete everywhere.
 */

import type { authErrors } from "./auth";
import type { orgErrors } from "./org";
import type { ratelimitErrors } from "./ratelimit";

export { authErrors } from "./auth";
export { orgErrors } from "./org";
export { ratelimitErrors } from "./ratelimit";

declare module "evlog" {
  interface RegisteredErrorCatalogs {
    auth: typeof authErrors;
    org: typeof orgErrors;
    ratelimit: typeof ratelimitErrors;
  }
}

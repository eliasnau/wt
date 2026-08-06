/**
 * Error catalogs. Prefer these over ad-hoc `createError(...)` so `code` stays
 * stable for client branching. Register new catalogs in `RegisteredErrorCatalogs`
 * below so their codes flow into autocomplete everywhere.
 */

import type { adminErrors } from "./admin";
import type { authErrors } from "./auth";
import type { billingErrors } from "./billing";
import type { groupsErrors } from "./groups";
import type { eventsErrors } from "./events";
import type { inventoryErrors } from "./inventory";
import type { membersErrors } from "./members";
import type { orgErrors } from "./org";
import type { ratelimitErrors } from "./ratelimit";
import type { statisticsErrors } from "./statistics";

export { adminErrors } from "./admin";
export { authErrors } from "./auth";
export { billingErrors } from "./billing";
export { groupsErrors } from "./groups";
export { eventsErrors } from "./events";
export { inventoryErrors } from "./inventory";
export { membersErrors } from "./members";
export { orgErrors } from "./org";
export { ratelimitErrors } from "./ratelimit";
export { statisticsErrors } from "./statistics";

declare module "evlog" {
  interface RegisteredErrorCatalogs {
    admin: typeof adminErrors;
    auth: typeof authErrors;
    billing: typeof billingErrors;
    groups: typeof groupsErrors;
    events: typeof eventsErrors;
    inventory: typeof inventoryErrors;
    members: typeof membersErrors;
    org: typeof orgErrors;
    ratelimit: typeof ratelimitErrors;
    statistics: typeof statisticsErrors;
  }
}

import { evlog } from "evlog/orpc";

import { requireAuth } from "./middlewares/auth";
import { identify } from "./middlewares/identify";
import { rateLimit } from "./middlewares/ratelimit";
import { o } from "./orpc";

export { o };

// evlog() outermost so it captures errors from inner middlewares + sets `operation`.
export const publicProcedure = o.use(evlog()).use(identify).use(rateLimit);

export const protectedProcedure = publicProcedure.use(requireAuth);

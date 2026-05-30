import { defineErrorCatalog } from "evlog";

export const ratelimitErrors = defineErrorCatalog("ratelimit", {
  EXCEEDED: {
    status: 429,
    message: "Rate limit exceeded",
    why: "You're sending requests faster than allowed.",
    // `fix` is overridden at the call site with the actual retry delay.
  },
});

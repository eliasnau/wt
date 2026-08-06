import { defineErrorCatalog } from "evlog";

export const statisticsErrors = defineErrorCatalog("statistics", {
  INVALID_RANGE: {
    status: 400,
    message: "Invalid date range",
    why: "The start month is after the end month, or the end month is in the future.",
    fix: "Pick a start month that isn't after the end month, with the end month no later than the current month.",
  },
  RANGE_TOO_LARGE: {
    status: 400,
    message: "Date range too large",
    why: "The requested timeline spans more months than the engine allows in one call.",
    fix: "Narrow the range and request additional periods separately.",
  },
});

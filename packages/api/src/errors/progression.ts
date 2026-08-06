import { defineErrorCatalog } from "evlog";

export const progressionErrors = defineErrorCatalog("progression", {
  SYSTEM_NOT_FOUND: { status: 404, message: "Graduation system not found" },
  RANK_NOT_FOUND: { status: 404, message: "Graduation rank not found" },
  MEMBER_NOT_FOUND: { status: 404, message: "Member not found" },
  AWARD_NOT_FOUND: { status: 404, message: "Awarded graduation not found" },
  SYSTEM_HAS_AWARDS: {
    status: 409,
    message: "Graduation system has awarded ranks",
    fix: "Keep the system so member history remains intact.",
  },
  RANK_HAS_AWARDS: {
    status: 409,
    message: "Graduation rank has been awarded",
    fix: "Keep the rank so member history remains intact.",
  },
  RANK_NOT_IN_SYSTEM: {
    status: 400,
    message: "Rank does not belong to the selected system",
  },
  ALREADY_HOLDS_RANK: {
    status: 409,
    message: "Member already holds this rank",
  },
});

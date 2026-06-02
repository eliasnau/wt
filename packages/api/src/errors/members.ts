import { defineErrorCatalog } from "evlog";

export const membersErrors = defineErrorCatalog("members", {
  NOT_FOUND: {
    status: 404,
    message: "Member not found",
    why: "The requested member doesn't exist or belongs to another organization.",
    fix: "Refresh the page or pick a different member.",
  },
  INVALID_IBAN: {
    status: 400,
    message: "Invalid IBAN",
    why: "The IBAN you entered doesn't match a recognised SEPA format.",
    fix: "Double-check the IBAN on the member's bank card.",
  },
  INVALID_BIC: {
    status: 400,
    message: "Invalid BIC",
    why: "The BIC must be 8 or 11 alphanumeric characters.",
    fix: "Check the BIC on the bank statement or look it up by IBAN.",
  },
  CONTRACT_NOT_FOUND: {
    status: 404,
    message: "Contract not found",
    why: "This member has no contract to update.",
    fix: "Create the member with a contract first.",
  },
  CONTRACT_NOT_ACTIVE: {
    status: 400,
    message: "Contract is not active",
    why: "Only members with an active contract can be edited this way.",
    fix: "Reactivate the contract or pick a different member.",
  },
  CONTRACT_ALREADY_CANCELLED: {
    status: 400,
    message: "Contract is already cancelled",
    why: "This contract was already cancelled.",
    fix: "Refresh the page to see the current cancellation date.",
  },
  JOINING_FEE_ALREADY_BILLED: {
    status: 400,
    message: "Joining fee can't be changed",
    why: "The joining fee has already been added to an invoice for this member.",
    fix: "Void the invoice that contains the joining fee before changing the amount.",
  },
  YEARLY_FEE_ALREADY_BILLED: {
    status: 400,
    message: "Yearly fee can't be changed",
    why: "This cycle's yearly fee has already been added to an invoice for this member.",
    fix: "Void the invoice that contains the yearly fee before changing the amount.",
  },
  CANCELLATION_DATE_INVALID: {
    status: 400,
    message: "Invalid cancellation date",
    why: "The date isn't a valid calendar day.",
    fix: "Pick a real date in YYYY-MM-DD format.",
  },
  CANCELLATION_DATE_NOT_LAST_DAY: {
    status: 400,
    message: "Cancellation must end on the last day of a month",
    why: "Contracts always run to the end of a calendar month.",
    fix: "Pick the last day of the chosen month.",
  },
  CANCELLATION_DATE_IN_PAST: {
    status: 400,
    message: "Cancellation date must be in the future",
    why: "You can't cancel a contract retroactively.",
    fix: "Pick a date after today.",
  },
  CANCELLATION_BEFORE_INITIAL_PERIOD: {
    status: 400,
    message: "Cancellation date is inside the initial period",
    why: "The contract's initial period hasn't ended yet — you can't cancel before then.",
    fix: "Pick a date on or after the initial period end date.",
  },
  ALREADY_IN_GROUP: {
    status: 400,
    message: "Member is already in this group",
    why: "This member already has a membership in the chosen group.",
    fix: "Edit the existing membership instead, or pick a different group.",
  },
  GROUP_MEMBERSHIP_NOT_FOUND: {
    status: 404,
    message: "Group membership not found",
    why: "This member isn't currently in the chosen group.",
    fix: "Refresh the page or assign the group first.",
  },
});

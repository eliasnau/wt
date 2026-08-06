import { defineErrorCatalog } from "evlog";

export const eventsErrors = defineErrorCatalog("events", {
  NOT_FOUND: {
    status: 404,
    message: "Event not found",
    why: "The event doesn't exist or belongs to another organization.",
    fix: "Refresh the page or choose another event.",
  },
  PARTICIPANT_NOT_FOUND: {
    status: 404,
    message: "Participant not found",
    why: "The participant doesn't exist in this event.",
    fix: "Refresh the participant list.",
  },
  MEMBER_NOT_FOUND: {
    status: 404,
    message: "Member not found",
    why: "The member doesn't exist in this organization.",
    fix: "Choose another member.",
  },
  ALREADY_REGISTERED: {
    status: 409,
    message: "Member is already registered",
    why: "This member already has an active entry for the event.",
    fix: "Update the existing participant instead.",
  },
  EVENT_FULL: {
    status: 409,
    message: "Event capacity reached",
    why: "The event has no remaining places.",
    fix: "Increase the capacity or cancel another registration first.",
  },
  NOTHING_TO_UPDATE: {
    status: 400,
    message: "No changes provided",
    why: "The update didn't contain any fields to change.",
    fix: "Edit at least one field before saving.",
  },
});

import { addEventParticipant } from "./add-participant";
import { createEvent } from "./create-event";
import { deleteEvent } from "./delete-event";
import { getEvent } from "./get-event";
import { listEvents } from "./list-events";
import { removeEventParticipant } from "./remove-participant";
import { updateEvent } from "./update-event";
import { updateEventParticipant } from "./update-participant";

export const eventsRouter = {
  list: listEvents,
  get: getEvent,
  create: createEvent,
  update: updateEvent,
  delete: deleteEvent,
  addParticipant: addEventParticipant,
  updateParticipant: updateEventParticipant,
  removeParticipant: removeEventParticipant,
};

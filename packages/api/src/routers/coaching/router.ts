import {
  createCoaching,
  deleteCoaching,
  listCoaching,
  setCoachingState,
  updateCoaching,
} from "./procedures";

export const coachingRouter = {
  list: listCoaching,
  create: createCoaching,
  update: updateCoaching,
  setState: setCoachingState,
  delete: deleteCoaching,
};

import { createGroup } from "./create";
import { deleteGroup } from "./delete";
import { getGroup } from "./get";
import { listGroups } from "./list";
import { updateGroup } from "./update";

export const groupsRouter = {
  list: listGroups,
  get: getGroup,
  create: createGroup,
  update: updateGroup,
  delete: deleteGroup,
};

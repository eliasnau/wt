import { getMemberMap } from "./member-map";
import { getSnapshot } from "./snapshot";
import { getTimeline } from "./timeline";

export const statisticsRouter = {
  timeline: getTimeline,
  snapshot: getSnapshot,
  memberMap: getMemberMap,
};

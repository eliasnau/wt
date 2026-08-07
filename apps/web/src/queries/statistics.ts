import { queryOptions } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export type TimelineGroupBy = "month" | "quarter" | "year";

export const statisticsSnapshotQueryOptions = () =>
  queryOptions({
    ...orpc.statistics.snapshot.queryOptions({}),
    staleTime: 30_000,
  });

export const statisticsTimelineQueryOptions = (input: {
  startMonth: string;
  endMonth: string;
  groupBy: TimelineGroupBy;
}) =>
  queryOptions({
    ...orpc.statistics.timeline.queryOptions({ input }),
    staleTime: 30_000,
  });

export const statisticsMemberMapQueryOptions = () =>
  queryOptions({
    ...orpc.statistics.memberMap.queryOptions({ input: {} }),
    staleTime: 30_000,
  });

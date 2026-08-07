import { queryOptions } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export const coachingListQueryOptions = () =>
  queryOptions({
    ...orpc.coaching.list.queryOptions({}),
    staleTime: 30_000,
  });

import { queryOptions } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export const groupsQueryOptions = () =>
  queryOptions({
    ...orpc.groups.list.queryOptions({}),
    staleTime: 30_000,
  });

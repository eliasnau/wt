import { queryOptions } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export const progressionSystemsQueryOptions = () =>
  queryOptions({
    ...orpc.progression.listSystems.queryOptions(),
    staleTime: 30_000,
  });

export const rankMembersQueryOptions = (rankId: string) =>
  queryOptions({
    ...orpc.progression.listRankMembers.queryOptions({ input: { rankId } }),
    staleTime: 30_000,
  });

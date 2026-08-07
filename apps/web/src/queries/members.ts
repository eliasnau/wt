import { queryOptions } from "@tanstack/react-query";

import { client, orpc } from "@/utils/orpc";

type MembersListInput = Parameters<typeof client.members.query>[0];

export const membersListQueryOptions = (input: MembersListInput) =>
  queryOptions({
    ...orpc.members.query.queryOptions({ input }),
    staleTime: 30_000,
  });

export const memberDetailQueryOptions = (memberId: string) =>
  queryOptions({
    ...orpc.members.get.queryOptions({ input: { memberId } }),
    staleTime: 30_000,
  });

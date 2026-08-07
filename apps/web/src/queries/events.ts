import { queryOptions } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export const eventsListQueryOptions = () =>
  queryOptions({
    ...orpc.events.list.queryOptions({}),
    staleTime: 30_000,
  });

export const eventDetailQueryOptions = (eventId: string) =>
  queryOptions({
    ...orpc.events.get.queryOptions({ input: { eventId } }),
    staleTime: 30_000,
  });

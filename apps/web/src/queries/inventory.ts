import { queryOptions } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export const inventoryListQueryOptions = () =>
  queryOptions({
    ...orpc.inventory.list.queryOptions({ input: { page: 1, limit: 100 } }),
    staleTime: 30_000,
  });

export const inventoryProductQueryOptions = (productId: string) =>
  queryOptions({
    ...orpc.inventory.get.queryOptions({ input: { productId } }),
    staleTime: 30_000,
  });

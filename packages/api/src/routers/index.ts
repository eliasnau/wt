import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { groupsRouter } from "./groups/router";
import { inventoryRouter } from "./inventory/router";
import { membersRouter } from "./members/router";
import { statisticsRouter } from "./statistics/router";

export const appRouter = {
  // Cheap call — uses the default token cost of 1.
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  // Example of a heavier procedure: consumes 5 tokens per call.
  privateData: protectedProcedure.meta({ cost: 5 }).handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  groups: groupsRouter,
  members: membersRouter,
  inventory: inventoryRouter,
  statistics: statisticsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

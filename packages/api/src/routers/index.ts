import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { adminRouter } from "./admin/router";
import { billingRouter } from "./billing/router";
import { groupsRouter } from "./groups/router";
import { eventsRouter } from "./events/router";
import { inventoryRouter } from "./inventory/router";
import { membersRouter } from "./members/router";
import { statisticsRouter } from "./statistics/router";

const healthCheck = publicProcedure.handler(() => {
  return "OK";
});

const privateData = protectedProcedure.meta({ cost: 5 }).handler(({ context }) => {
  return {
    message: "This is private",
    user: context.session?.user,
  };
});

type AppRouterDefinition = {
  healthCheck: typeof healthCheck;
  privateData: typeof privateData;
  groups: typeof groupsRouter;
  events: typeof eventsRouter;
  members: typeof membersRouter;
  inventory: typeof inventoryRouter;
  statistics: typeof statisticsRouter;
  billing: typeof billingRouter;
  admin: typeof adminRouter;
};

export const appRouter: AppRouterDefinition = {
  // Cheap call — uses the default token cost of 1.
  healthCheck,
  // Example of a heavier procedure: consumes 5 tokens per call.
  privateData,
  groups: groupsRouter,
  events: eventsRouter,
  members: membersRouter,
  inventory: inventoryRouter,
  statistics: statisticsRouter,
  billing: billingRouter,
  admin: adminRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

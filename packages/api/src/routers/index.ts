import type { RouterClient } from "@orpc/server";
import { publicProcedure } from "../index";
import { billingRouter } from "./billing";
import { groupsRouter } from "./groups";
import { membersRouter } from "./members";
import { organizationsRouter } from "./organizations";
import { selfRegistrationsRouter } from "./selfRegistrations";
import { statisticsRouter } from "./statistics";

export const appRouter = {
	healthCheck: publicProcedure
		.handler(() => {
			return "OK";
		})
		.route({ method: "GET", successStatus: 200 }),
	members: { ...membersRouter },
	billing: {
		...billingRouter,
	},
	groups: {
		...groupsRouter,
	},
	organizations: {
		...organizationsRouter,
	},
	statistics: {
		...statisticsRouter,
	},
	selfRegistrations: {
		...selfRegistrationsRouter,
	},
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

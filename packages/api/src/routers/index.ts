import type { RouterClient } from "@orpc/server";
import { publicProcedure } from "../index";
import { groupsRouter } from "./groups";
import { membersRouter } from "./members";
import { paymentBatchesRouter } from "./paymentBatches";

export const appRouter = {
	healthCheck: publicProcedure
		.handler(() => {
			return "OK";
		})
		.route({ method: "GET", successStatus: 200 }),
	members: { ...membersRouter },
	groups: {
		...groupsRouter,
	},
	paymentBatches: {
		...paymentBatchesRouter,
	},
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

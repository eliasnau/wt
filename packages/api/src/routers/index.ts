import { publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { membersRouter } from "./members";

export const appRouter = {
	healthCheck: publicProcedure
		.handler(() => {
			return "OK";
		})
		.route({ method: "GET", successStatus: 200 }),
	...membersRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

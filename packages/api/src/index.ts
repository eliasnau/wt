import { os } from "@orpc/server";
import type { BaseContext } from "./context";
import { authMiddleware } from "./middleware/auth";
import { wideEventMiddleware } from "./middleware/wideEvent";

export const o = os.$context<BaseContext>();

export const publicProcedure = o.use(wideEventMiddleware());

export const protectedProcedure = o
	.use(wideEventMiddleware())
	.use(authMiddleware);

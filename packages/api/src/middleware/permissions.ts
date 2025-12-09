import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";

export const requirePermission = (permission: string) => {
	return os
		.$context<Context & { user: { id: string } }>()
		.middleware(async ({ context, next }) => {
			const hasPermission = context.has({ permission });

			if (!hasPermission) {
				throw new ORPCError("FORBIDDEN", {
					message: `You don't have permission`,
				});
			}

			return next();
		});
};

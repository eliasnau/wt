import { protectedProcedure } from "../index";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";

export const membersRouter = {
	list: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission("org:member_management:members_read"))
		.handler(() => {
			return [
				{
					id: "1",
					name: "John Doe",
					email: "john@example.com",
				},
				{
					id: "2",
					name: "Jane Smith",
					email: "jane@example.com",
				},
			];
		})
		.route({ method: "GET", path: "/members" }),
};

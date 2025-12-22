import { APIError, type BetterAuthPlugin, type Session } from "better-auth";
import { sessionMiddleware } from "better-auth/api";
import { createAuthEndpoint } from "better-auth/plugins";
import { z } from "zod";

export const manageSessions = () => {
	return {
		id: "manage-sessions",
		endpoints: {
			revokeSessionById: createAuthEndpoint(
				"/revoke-session-by-id",
				{
					method: "POST",
					use: [sessionMiddleware],
					body: z.object({
						sessionId: z.string().meta({
							description: "The id of the Session to revoke",
						}),
					}),
				},
				async (ctx) => {
					const sessionId = ctx.body.sessionId;

					const currentSession = ctx.context.session;
					if (!currentSession?.user) {
						throw new APIError("UNAUTHORIZED", {
							message: "You must be signed in to revoke a session",
						});
					}

					const session: Session | undefined | null =
						await ctx.context.adapter.findOne({
							model: "session",
							where: [
								{
									field: "id",
									value: sessionId,
								},
							],
						});
					if (!session?.id) {
						throw new APIError("NOT_FOUND", {
							message: "This session does not exist",
							code: "NOT_FOUND",
						});
					}

					if (session.userId !== currentSession.user.id) {
						throw new APIError("NOT_FOUND", {
							message: "This session does not exist",
							code: "NOT_FOUND",
						});
					}

					await ctx.context.internalAdapter.deleteSession(session.token);

					return ctx.json({
						success: true,
						message: "Session revoked successfully",
					});
				},
			),
		},
	} satisfies BetterAuthPlugin;
};

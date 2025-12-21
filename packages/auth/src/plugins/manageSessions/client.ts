import type { BetterAuthClientPlugin } from "better-auth/client";
import type { manageSessions } from "./index";

export const manageSessionsClient = () => {
	return {
		id: "manage-sessions",
		$InferServerPlugin: {} as ReturnType<typeof manageSessions>,
	} satisfies BetterAuthClientPlugin;
};

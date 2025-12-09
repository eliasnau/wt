import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { CheckAuthorizationFromSessionClaims } from "@clerk/backend";

export interface Context {
	userId: string | null;
	sessionId: string | null;
	orgId: string | null | undefined;
	has: CheckAuthorizationFromSessionClaims;
	req: NextRequest;
}

export async function createContext(req: NextRequest): Promise<Context> {
	const authData = await auth();
	
	return {
		userId: authData.userId,
		sessionId: authData.sessionId,
		orgId: authData.orgId,
		has: authData.has || (() => false),
		req,
	};
}

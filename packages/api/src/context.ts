import type { NextRequest } from "next/server";
import type { WideEvent } from "./middleware/wideEvent";

export interface BaseContext {
	headers: Headers;
	req: NextRequest;
}

export interface Context extends BaseContext {
	wideEvent: WideEvent;
	session?: {
		id: string;
		createdAt: Date;
		updatedAt: Date;
		userId: string;
		expiresAt: Date;
		token: string;
		ipAddress?: string | null;
		userAgent?: string | null;
		activeOrganizationId?: string | null;
	};
	user?: {
		id: string;
	};
	userId?: string;
}

export async function createContext(req: NextRequest): Promise<BaseContext> {
	return {
		headers: req.headers,
		req,
	};
}

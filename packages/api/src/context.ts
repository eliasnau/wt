import type { NextRequest } from "next/server";

export interface Context {
	headers: Headers;
	req: NextRequest;
}

export async function createContext(req: NextRequest): Promise<Context> {
	return {
		headers: req.headers,
		req,
	};
}

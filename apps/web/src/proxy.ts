import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "@repo/auth";

export default function proxy(req: NextRequest) {
	const sessionCookie = getSessionCookie(req);

	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/sign-in", req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};

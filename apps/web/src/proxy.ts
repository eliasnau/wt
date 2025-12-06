import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

const isOrganizationRoute = createRouteMatcher(["/organizations(.*)"]);

export default clerkMiddleware(async (auth, req) => {
	const { isAuthenticated, sessionStatus, redirectToSignIn } = await auth();

	if (isOrganizationRoute(req)) {
		if (sessionStatus === "pending") {
			return NextResponse.next();
		}
		if (!isAuthenticated) {
			return redirectToSignIn();
		}
		return NextResponse.next();
	}

	if (isProtectedRoute(req)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};

import { getSessionCookie } from "@repo/auth";
import { type NextRequest, NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);

  const sessionCookie = getSessionCookie(req);

  if (!sessionCookie) {
    return NextResponse.redirect(
      new URL(
        `/sign-in?redirectUrl=${encodeURIComponent(req.nextUrl.pathname)}`,
        req.url,
      ),
    );
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

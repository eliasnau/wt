import { auth } from "@matdesk/auth";

const IP_ADDRESS_HEADERS = ["x-forwarded-for", "x-real-ip", "x-vercel-forwarded-for"] as const;

function getIpAddress(headers: Headers) {
  for (const header of IP_ADDRESS_HEADERS) {
    const ipAddress = headers.get(header)?.split(",")[0]?.trim();
    if (ipAddress) return ipAddress;
  }

  return null;
}

export async function createContext({ req }: { req: Request }) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // Client IP for rate-limiting anonymous requests (authed requests key on the
  // user id instead). `x-forwarded-for` may be a comma-separated list — the
  // left-most entry is the original client.
  const ipAddress = getIpAddress(req.headers);

  return {
    auth: null,
    session,
    ipAddress,
    // Original request headers — used by `requirePermission` to call into
    // `auth.api.hasPermission`, which resolves the active member role from
    // the session cookie.
    headers: req.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

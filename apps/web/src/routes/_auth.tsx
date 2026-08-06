import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { getUser } from "@/functions/get-user";
import { safeRedirectUrl } from "@/lib/redirect-url";

/**
 * Shared by every child of this layout. `redirectUrl` carries the page the user
 * was trying to reach before being bounced here; `invite` flags that they came
 * from an organization invitation link.
 *
 * Kept optional (no zod `.default()`) so `/sign-in` doesn't grow a
 * `?redirectUrl=%2Forganizations` tail on every navigation — the default is
 * applied at read time via `safeRedirectUrl`.
 */
const authSearchSchema = z.object({
  invite: z
    .union([z.boolean(), z.number(), z.string()])
    // Invitation links write `?invite=1`; the router's JSON-ish search parser
    // turns that into the number 1, not a boolean. Only presence matters.
    .transform((value) => value !== false && value !== 0 && value !== "false")
    .optional(),
  redirectUrl: z.string().optional(),
});

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ search }) => {
    // Bounce already-authenticated users out of the auth screens. This lives on
    // the layout rather than per-route because `/verify-2fa` is reached with a
    // *partial* session — better-auth's two-factor hand-off sets only its own
    // temporary cookie, so `getUser()` is still null there and the check below
    // doesn't fire. Once the second factor is verified a real session exists and
    // bouncing is exactly what we want.
    const session = await getUser();
    if (session) {
      throw redirect({ href: safeRedirectUrl(search.redirectUrl) });
    }
  },
  component: AuthLayout,
  validateSearch: authSearchSchema,
});

function AuthLayout() {
  return (
    <div className="bg-sidebar">
      <Outlet />
    </div>
  );
}

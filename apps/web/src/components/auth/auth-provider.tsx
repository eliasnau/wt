"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo } from "react";

import { sessionQueryOptions } from "@/functions/get-user";
import { authClient } from "@/lib/auth-client";

type SessionQuery = ReturnType<typeof authClient.useSession>;
type OrganizationsQuery = ReturnType<typeof authClient.useListOrganizations>;
type ActiveOrganizationQuery = ReturnType<typeof authClient.useActiveOrganization>;

type Session = NonNullable<SessionQuery["data"]>;
type User = Session["user"];
type Organization = NonNullable<OrganizationsQuery["data"]>[number];
type ActiveOrganization = NonNullable<ActiveOrganizationQuery["data"]>;

type AuthContextValue = {
  /** Raw session object (user + session) or null when signed out. */
  session: Session | null;
  user: User | null;
  isPending: boolean;
  error: SessionQuery["error"];

  organizations: Organization[];
  activeOrganization: ActiveOrganization | null;
  isOrganizationsPending: boolean;
  organizationsError: OrganizationsQuery["error"];

  /** Refetch everything (session + organizations). */
  refetch: () => Promise<void>;
  refetchSession: SessionQuery["refetch"];
  refetchOrganizations: OrganizationsQuery["refetch"];

  /** Switch the active organization, then refresh derived state. */
  setActiveOrganization: (organizationId: string | null) => Promise<void>;
  signOut: typeof authClient.signOut;

  /** Escape hatch for anything not surfaced above. */
  authClient: typeof authClient;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Hydrated from the server on first paint (no flash). Once better-auth's
  // client store resolves, it becomes the reactive source of truth so sign
  // in/out update the UI without any manual cache wrangling.
  const hydratedSession = useQuery(sessionQueryOptions);
  const liveSession = authClient.useSession();
  const organizationsQuery = authClient.useListOrganizations();
  const activeOrganizationQuery = authClient.useActiveOrganization();

  const session = (liveSession.isPending ? hydratedSession.data : liveSession.data) as
    | Session
    | null
    | undefined;
  const isSessionPending = liveSession.isPending && hydratedSession.isPending;

  const refetchSession = liveSession.refetch;
  const refetchOrganizations = organizationsQuery.refetch;
  const refetchActiveOrganization = activeOrganizationQuery.refetch;

  const refetch = useCallback(async () => {
    await Promise.all([refetchSession(), refetchOrganizations(), refetchActiveOrganization()]);
  }, [refetchSession, refetchOrganizations, refetchActiveOrganization]);

  const setActiveOrganization = useCallback(
    async (organizationId: string | null) => {
      const result = await authClient.organization.setActive({ organizationId });
      if (result.error) {
        throw new Error(result.error.message ?? "Could not activate organization");
      }
      await Promise.all([refetchSession(), refetchActiveOrganization()]);
    },
    [refetchSession, refetchActiveOrganization],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session: session ?? null,
      user: session?.user ?? null,
      isPending: isSessionPending,
      error: liveSession.error,

      organizations: organizationsQuery.data ?? [],
      activeOrganization: activeOrganizationQuery.data ?? null,
      isOrganizationsPending: organizationsQuery.isPending,
      organizationsError: organizationsQuery.error,

      refetch,
      refetchSession,
      refetchOrganizations,

      setActiveOrganization,
      signOut: authClient.signOut,
      authClient,
    }),
    [
      session,
      isSessionPending,
      liveSession.error,
      organizationsQuery.data,
      organizationsQuery.isPending,
      organizationsQuery.error,
      activeOrganizationQuery.data,
      refetch,
      refetchSession,
      refetchOrganizations,
      setActiveOrganization,
    ],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}

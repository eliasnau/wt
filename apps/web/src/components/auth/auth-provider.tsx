"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AuthContext, type AuthContextValue } from "@/components/auth/auth-context";
import { sessionQueryOptions } from "@/functions/get-user";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";

type SessionQuery = ReturnType<typeof authClient.useSession>;
type Session = NonNullable<SessionQuery["data"]>;

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

  // better-auth only re-signals its organization atoms on organization
  // mutations (create/delete/update) — signing in does not touch them. Since
  // this provider is mounted at the root, the list a user sees after signing in
  // is still the one fetched while they were anonymous (a 401), which reads as
  // "no organizations" until a hard reload. Refetch whenever the user changes.
  const userId = session?.user?.id ?? null;
  const loadedForUserRef = useRef(userId);
  const [isOrganizationsStale, setIsOrganizationsStale] = useState(false);

  useEffect(() => {
    if (loadedForUserRef.current === userId) return;
    loadedForUserRef.current = userId;
    if (!userId) return;

    setIsOrganizationsStale(true);
    void Promise.all([refetchOrganizations(), refetchActiveOrganization()]).finally(() => {
      // Only clear if no newer user has taken over in the meantime.
      if (loadedForUserRef.current === userId) setIsOrganizationsStale(false);
    });
  }, [userId, refetchOrganizations, refetchActiveOrganization]);

  const setActiveOrganization = useCallback(
    async (organizationId: string | null) => {
      const result = await authClient.organization.setActive({ organizationId });
      if (result.error) {
        throw new Error(result.error.message ?? "Could not activate organization");
      }
      await Promise.all([refetchSession(), refetchActiveOrganization()]);
      await queryClient.invalidateQueries();
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
      // While stale the list still describes the previous user, so keep callers
      // on their loading state instead of flashing an empty/error result.
      isOrganizationsPending: organizationsQuery.isPending || isOrganizationsStale,
      organizationsError: isOrganizationsStale ? null : organizationsQuery.error,

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
      isOrganizationsStale,
      activeOrganizationQuery.data,
      refetch,
      refetchSession,
      refetchOrganizations,
      setActiveOrganization,
    ],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

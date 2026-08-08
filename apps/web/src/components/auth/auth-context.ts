"use client";

import { createContext, useContext } from "react";

import { authClient } from "@/lib/auth-client";

type SessionQuery = ReturnType<typeof authClient.useSession>;
type OrganizationsQuery = ReturnType<typeof authClient.useListOrganizations>;
type ActiveOrganizationQuery = ReturnType<typeof authClient.useActiveOrganization>;

type Session = NonNullable<SessionQuery["data"]>;
type User = Session["user"];
type Organization = NonNullable<OrganizationsQuery["data"]>[number];
type ActiveOrganization = NonNullable<ActiveOrganizationQuery["data"]>;

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isPending: boolean;
  error: SessionQuery["error"];
  organizations: Organization[];
  activeOrganization: ActiveOrganization | null;
  isOrganizationsPending: boolean;
  organizationsError: OrganizationsQuery["error"];
  refetch: () => Promise<void>;
  refetchSession: SessionQuery["refetch"];
  refetchOrganizations: OrganizationsQuery["refetch"];
  setActiveOrganization: (organizationId: string | null) => Promise<void>;
  signOut: typeof authClient.signOut;
  authClient: typeof authClient;
};

/** Kept separate from the provider component so Fast Refresh cannot recreate it. */
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}

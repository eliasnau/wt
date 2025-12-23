"use client";

import { authClient } from "@repo/auth/client";
import { createContext, type ReactNode } from "react";

type Session = Awaited<ReturnType<typeof authClient.useSession>>["data"];
type Organization = Awaited<
  ReturnType<typeof authClient.useActiveOrganization>
>["data"];

interface AuthContextValue {
  session: Session;
  activeOrganization: Organization | null | undefined;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const { data: organization } = authClient.useActiveOrganization();

  return (
    <AuthContext.Provider value={{ session, activeOrganization: organization }}>
      {children}
    </AuthContext.Provider>
  );
}

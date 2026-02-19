"use client";

import { authClient } from "@repo/auth/client";
import posthog from "posthog-js";
import { createContext, type ReactNode, useEffect } from "react";

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

	useEffect(() => {
		if (session?.user) {
			posthog.identify(session.user.id, {
				email: session.user.email,
				name: session.user.name,
			});
		}
	}, [session]);

	useEffect(() => {
		if (organization?.id) {
			posthog.group("organization", organization.id, {
				name: organization.name,
			});
		} else {
			posthog.resetGroups();
		}
	}, [organization]);

	return (
		<AuthContext.Provider value={{ session, activeOrganization: organization }}>
			{children}
		</AuthContext.Provider>
	);
}
